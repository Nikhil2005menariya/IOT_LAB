// src/routes/sessions.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Item = require('../models/Item');
const Session = require('../models/Session');
const Event = require('../models/Event');
const Student = require('../models/Student');

// POST /api/v1/sessions/borrow
router.post('/borrow', async (req, res) => {
  const { student_reg_no, items, due_date, createdBy } = req.body;
  if (!student_reg_no || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'student_reg_no and items are required' });
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // ensure student exists (create if not)
    let student = await Student.findOne({ reg_no: student_reg_no }).session(session);
    if (!student) {
      student = await Student.create([{ reg_no: student_reg_no }], { session });
      student = student[0];
    }

    // validate & update items
    for (const it of items) {
      const dbItem = await Item.findById(it.item_id).session(session);
      if (!dbItem) throw new Error(`Item not found: ${it.item_id}`);
      if (dbItem.available_quantity < it.qty) throw new Error(`Insufficient quantity for ${dbItem.name}`);
      dbItem.available_quantity -= it.qty;
      await dbItem.save({ session });

      await Event.create([{
        type: 'borrow',
        session_id: null, // will set after creating sessionId
        item_id: dbItem._id,
        qty: it.qty,
        timestamp: new Date(),
        user: createdBy || 'system'
      }], { session });
    }

    // create session
    const newSession = await Session.create([{
      student_id: student._id,
      student_reg_no,
      items: items.map(i => ({ item_id: i.item_id, sku: i.sku, name: i.name, qty: i.qty })),
      due_date,
      createdBy
    }], { session });

    // update events to reference session id
    const sessId = newSession[0]._id;
    await Event.updateMany({ session_id: null }, { $set: { session_id: sessId } }).session(session);

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ session: newSession[0] });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

// POST /api/v1/sessions/:id/return
router.post('/:id/return', async (req, res) => {
  const { items, user } = req.body;
  const sessionId = req.params.id;

  const s = await Session.findById(sessionId);
  if (!s) return res.status(404).json({ error: 'Session not found' });

  const mongoSess = await mongoose.startSession();
  try {
    mongoSess.startTransaction();
    for (const it of items) {
      const dbItem = await Item.findById(it.item_id).session(mongoSess);
      if (!dbItem) throw new Error(`Item not found: ${it.item_id}`);
      dbItem.available_quantity += it.qty;
      await dbItem.save({ session: mongoSess });

      await Event.create([{
        type: 'return',
        session_id: s._id,
        item_id: dbItem._id,
        qty: it.qty,
        timestamp: new Date(),
        user: user || 'system'
      }], { session: mongoSess });

      s.returned_items.push({ item_id: it.item_id, qty: it.qty, returned_at: new Date() });
    }

    // simple status: set returned if all items returned (improve later)
    s.status = 'returned';
    s.returned_at = new Date();
    await s.save({ session: mongoSess });

    await mongoSess.commitTransaction();
    mongoSess.endSession();

    res.json({ session: s });
  } catch (err) {
    await mongoSess.abortTransaction();
    mongoSess.endSession();
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
