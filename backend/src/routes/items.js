// src/routes/items.js
const express = require('express');
const router = express.Router();
const Item = require('../models/Item');

// GET /api/v1/items
router.get('/', async (req, res) => {
  const q = req.query.q;
  const filter = {};
  if (q) filter.$text = { $search: q }; // add text index later
  const items = await Item.find(filter).limit(200).lean();
  res.json({ data: items });
});

// GET /api/v1/items/:id
router.get('/:id', async (req, res) => {
  const it = await Item.findById(req.params.id);
  if (!it) return res.status(404).json({ error: 'Item not found' });
  res.json(it);
});

// POST /api/v1/items
router.post('/', async (req, res) => {
  const payload = req.body;
  const it = new Item(payload);
  await it.save();
  res.status(201).json(it);
});

// PUT /api/v1/items/:id
router.put('/:id', async (req, res) => {
  const updated = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

module.exports = router;
