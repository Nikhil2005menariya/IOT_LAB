// src/routes/sessions.js
const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const Session = require('../models/Session');
const Event = require('../models/Event');
const Student = require('../models/Student');
const mongoose = require('mongoose');

/**
 * Helpers
 */
async function tryDecrementItem(itemId, qty) {
  const res = await Item.updateOne(
    { _id: itemId, available_quantity: { $gte: qty } },
    { $inc: { available_quantity: -qty } }
  );
  return res.matchedCount === 1 && res.modifiedCount === 1;
}

async function incrementItem(itemId, qty) {
  await Item.updateOne(
    { _id: itemId },
    { $inc: { available_quantity: qty } }
  );
}

/**
 * POST /api/v1/sessions/borrow
 */
router.post('/borrow', async (req, res) => {
  try {
    const { student_reg_no, items, due_date, createdBy } = req.body;

    if (!student_reg_no || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'student_reg_no and items are required' });
    }

    let student = await Student.findOne({ reg_no: student_reg_no });
    if (!student) {
      student = await Student.create({ reg_no: student_reg_no });
    }

    const decremented = [];

    for (const it of items) {
      const ok = await tryDecrementItem(it.item_id, it.qty);
      if (!ok) {
        for (const prev of decremented) {
          await incrementItem(prev.item_id, prev.qty).catch(() => {});
        }
        return res.status(400).json({ error: `Insufficient quantity for item ${it.name}` });
      }
      decremented.push({ item_id: it.item_id, qty: it.qty });
    }

    const sessionDoc = await Session.create({
      student_id: student._id,
      student_reg_no,
      items: items.map(i => ({
        item_id: i.item_id,
        sku: i.sku,
        name: i.name,
        qty: i.qty
      })),
      due_date,
      createdBy
    });

    const events = items.map(i => ({
      type: 'borrow',
      session_id: sessionDoc._id,
      item_id: new mongoose.Types.ObjectId(i.item_id),
      qty: i.qty,
      timestamp: new Date(),
      user: createdBy || 'system'
    }));

    await Event.insertMany(events);

    res.status(201).json({ session: sessionDoc });

  } catch (err) {
    console.error('borrow error', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/v1/sessions/:id/return
 */
router.post('/:id/return', async (req, res) => {
  try {
    const { items, user } = req.body;
    const sessionId = req.params.id;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items array required' });
    }

    const sessionDoc = await Session.findById(sessionId);
    if (!sessionDoc) return res.status(404).json({ error: 'Session not found' });

    const heldMap = new Map();
    sessionDoc.items.forEach(it => {
      heldMap.set(String(it.item_id), Number(it.qty));
    });

    for (const r of items) {
      const itemId = String(r.item_id);
      const qty = Number(r.qty);

      if (!qty || qty <= 0) {
        return res.status(400).json({ error: 'Invalid return quantity' });
      }

      const heldQty = heldMap.get(itemId);
      if (!heldQty || qty > heldQty) {
        return res.status(400).json({ error: 'Invalid return quantity' });
      }
    }

    const events = [];

    for (const r of items) {
      const itemId = String(r.item_id);
      const qty = Number(r.qty);

      await incrementItem(itemId, qty);

      sessionDoc.items = sessionDoc.items
        .map(it =>
          String(it.item_id) === itemId
            ? { ...it.toObject(), qty: it.qty - qty }
            : it
        )
        .filter(it => it.qty > 0);

      sessionDoc.returned_items.push({
        item_id: itemId,
        qty,
        returned_at: new Date()
      });

      events.push({
        type: 'return',
        session_id: sessionDoc._id,
        item_id: new mongoose.Types.ObjectId(itemId),
        qty,
        timestamp: new Date(),
        user: user || 'system'
      });
    }

    if (events.length) await Event.insertMany(events);

    if (sessionDoc.items.length === 0) {
      sessionDoc.status = 'returned';
      sessionDoc.returned_at = new Date();
    } else {
      sessionDoc.status = 'partial';
    }

    await sessionDoc.save();

    res.json({ session: sessionDoc });

  } catch (err) {
    console.error('return error', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/v1/sessions
 * FIXED: Always return FULL HISTORY for a student
 */
router.get('/', async (req, res) => {
  try {
    const { student_reg_no } = req.query;
    const filter = {};

    if (student_reg_no) {
      filter.student_reg_no = student_reg_no;
      // ✅ NO status filter → include returned history
    }

    const sessions = await Session.find(filter)
      .sort({ borrowed_at: -1 })
      .limit(200)
      .lean();

    res.json({ data: sessions });

  } catch (err) {
    console.error('sessions list error', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/v1/sessions/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const s = await Session.findById(req.params.id).lean();
    if (!s) return res.status(404).json({ error: 'Session not found' });
    res.json({ data: s });
  } catch (err) {
    console.error('session get error', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
