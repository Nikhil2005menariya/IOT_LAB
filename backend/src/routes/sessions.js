// src/routes/sessions.js
const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const Session = require('../models/Session');
const Event = require('../models/Event');
const Student = require('../models/Student');
const mongoose = require('mongoose');

/**
 * Helper: decrement item available_quantity atomically if enough stock exists.
 * Returns true if success, false if insufficient stock or not found.
 */
async function tryDecrementItem(itemId, qty) {
  const res = await Item.updateOne(
    { _id: itemId, available_quantity: { $gte: qty } },
    { $inc: { available_quantity: -qty } }
  );
  return res.matchedCount === 1 && res.modifiedCount === 1;
}

/**
 * Helper: increment item available_quantity (used for rollback or returns).
 */
async function incrementItem(itemId, qty) {
  await Item.updateOne(
    { _id: itemId },
    { $inc: { available_quantity: qty } }
  );
}

/**
 * POST /api/v1/sessions/borrow
 * Body: { student_reg_no, items: [{ item_id, sku, name, qty }], due_date, createdBy }
 *
 * Approach:
 *  - Ensure student exists (create if not).
 *  - For each requested item, attempt an atomic decrement.
 *  - If any decrement fails, revert prior decrements and return error.
 *  - Create the session and events.
 */
router.post('/borrow', async (req, res) => {
  try {
    const { student_reg_no, items, due_date, createdBy } = req.body;
    if (!student_reg_no || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'student_reg_no and items are required' });
    }

    // Ensure student exists (create if missing)
    let student = await Student.findOne({ reg_no: student_reg_no });
    if (!student) {
      student = await Student.create({ reg_no: student_reg_no });
    }

    // Track which items we successfully decremented so we can rollback if needed
    const decremented = [];

    for (const it of items) {
      const ok = await tryDecrementItem(it.item_id, it.qty);
      if (!ok) {
        // rollback previously decremented items
        for (const prev of decremented) {
          await incrementItem(prev.item_id, prev.qty).catch(() => {});
        }
        return res.status(400).json({ error: `Insufficient quantity for item ${it.name || it.item_id}` });
      }
      decremented.push({ item_id: it.item_id, qty: it.qty });
    }

    // All decrements succeeded — create the session
    const sessionDoc = await Session.create({
      student_id: student._id,
      student_reg_no,
      items: items.map(i => ({ item_id: i.item_id, sku: i.sku, name: i.name, qty: i.qty })),
      due_date,
      createdBy
    });

    // Create events referencing the session
    const events = items.map(i => ({
      type: 'borrow',
      session_id: sessionDoc._id,
      item_id: new mongoose.Types.ObjectId(i.item_id),
      qty: i.qty,
      timestamp: new Date(),
      user: createdBy || 'system'
    }));


    await Event.insertMany(events);

    return res.status(201).json({ session: sessionDoc });
  } catch (err) {
    console.error('borrow error', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
});

/**
 * POST /api/v1/sessions/:id/return
 * Body: { items: [{ item_id, qty }], user }
 *
 * Approach:
 *  - For each returned item, increment available_quantity.
 *  - Append to session.returned_items.
 *  - If after processing all returned items all quantities are returned, mark session returned.
 */
// POST /api/v1/sessions/:id/return
router.post('/:id/return', async (req, res) => {
  try {
    const { items, user } = req.body;
    const sessionId = req.params.id;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items array required' });
    }

    // load session (Mongoose document so we can modify and save)
    const sessionDoc = await Session.findById(sessionId);
    if (!sessionDoc) return res.status(404).json({ error: 'Session not found' });

    // Build map of currently held quantities from sessionDoc.items
    const heldMap = new Map(); // itemIdStr -> { idx, qty }
    sessionDoc.items.forEach((it, idx) => {
      const idStr = String((it.item_id && it.item_id._id) ? it.item_id._id : it.item_id);
      heldMap.set(idStr, { idx, qty: Number(it.qty || 0) });
    });

    // Validation: ensure each requested return item is actually held and not returning more than held
    for (const reqIt of items) {
      const iid = String(reqIt.item_id);
      const qtyToReturn = Number(reqIt.qty || 0);
      if (!qtyToReturn || qtyToReturn <= 0) {
        return res.status(400).json({ error: `Invalid qty for item ${iid}` });
      }
      const held = heldMap.get(iid);
      if (!held) {
        return res.status(400).json({ error: `Student does not hold item ${iid}` });
      }
      if (qtyToReturn > held.qty) {
        return res.status(400).json({ error: `Return qty ${qtyToReturn} exceeds held qty ${held.qty} for item ${iid}` });
      }
    }

    // All validation passed -> apply updates in-memory to sessionDoc.items then persist
    // We'll also create events and increment Item.available_quantity
    const eventsToCreate = [];
    for (const reqIt of items) {
      const iid = String(reqIt.item_id);
      const qtyToReturn = Number(reqIt.qty);

      // update inventory available_quantity
      await incrementItem(iid, qtyToReturn);

      // create event
      eventsToCreate.push({
        type: 'return',
        session_id: sessionDoc._id,
        item_id: new mongoose.Types.ObjectId(iid),
        qty: qtyToReturn,
        timestamp: new Date(),
        user: user || 'system'
      });

      // update sessionDoc.items in-place: reduce qty or remove entry
      // find matching item entry index (use heldMap)
      const held = heldMap.get(iid);
      if (!held) {
        // This should not happen because of earlier validation, but guard anyway
        continue;
      }
      const idx = held.idx;
      const currentQty = Number(sessionDoc.items[idx].qty || 0);
      const newQty = currentQty - qtyToReturn;
      if (newQty <= 0) {
        // remove the item entry
        sessionDoc.items.splice(idx, 1);
        // After splicing, indexes in heldMap may be invalid; rebuild map after loop or mark for rebuild
        // We'll rebuild heldMap after processing all items
      } else {
        sessionDoc.items[idx].qty = newQty;
      }

      // append to returned_items log
      sessionDoc.returned_items.push({ item_id: reqIt.item_id, qty: qtyToReturn, returned_at: new Date() });
    }

    // Insert events (bulk)
    if (eventsToCreate.length > 0) {
      await Event.insertMany(eventsToCreate);
    }

    // Recompute session status: if no items left -> returned else partial/active
    if (!sessionDoc.items || sessionDoc.items.length === 0) {
      sessionDoc.status = 'returned';
      sessionDoc.returned_at = new Date();
    } else {
      sessionDoc.status = 'partial';
      // keep returned_at null until fully returned
    }

    // Save sessionDoc (persists modified items and returned_items)
    await sessionDoc.save();

    // Return the updated session (populate item refs for convenience)
    const respSession = await Session.findById(sessionDoc._id).populate('items.item_id', 'sku name').lean();
    return res.json({ session: respSession });
  } catch (err) {
    console.error('return error', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
});

// GET list (recent)
// GET /api/v1/sessions  (update existing handler)
router.get('/', async (req, res) => {
  try {
    const { student_reg_no, all } = req.query;
    const filter = {};
    if (student_reg_no) {
      filter.student_reg_no = student_reg_no;
      if (!all) {
        // default: only active or partial sessions (not fully returned)
        filter.status = { $in: ['active', 'partial'] };
      }
    }
    // otherwise, when no student_reg_no, return recent sessions (as before)
    const sessions = await Session.find(filter).sort({ borrowed_at: -1 }).limit(200).lean();
    res.json({ data: sessions });
  } catch (err) {
    console.error('sessions list error', err);
    res.status(500).json({ error: err.message });
  }
});


// GET session by id
router.get('/:id', async (req, res) => {
  try {
    const s = await Session.findById(req.params.id).populate('items.item_id', 'sku name').lean();
    if (!s) return res.status(404).json({ error: 'Session not found' });
    res.json({ data: s });
  } catch (err) {
    console.error('session get error', err);
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
