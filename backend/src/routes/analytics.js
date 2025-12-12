// src/routes/analytics.js
const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Item = require('../models/Item');

// GET /api/v1/analytics/top-borrowed?days=30&limit=10
router.get('/top-borrowed', async (req, res) => {
  const days = parseInt(req.query.days || '30', 10);
  const limit = parseInt(req.query.limit || '10', 10);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const pipeline = [
    { $match: { type: 'borrow', timestamp: { $gte: since } } },
    { $group: { _id: '$item_id', totalQty: { $sum: '$qty' } } },
    { $sort: { totalQty: -1 } },
    { $limit: limit },
    { $lookup: { from: 'items', localField: '_id', foreignField: '_id', as: 'item' } },
    { $unwind: '$item' },
    { $project: { sku: '$item.sku', name: '$item.name', totalQty: 1, available_quantity: '$item.available_quantity' } }
  ];

  const results = await Event.aggregate(pipeline);
  res.json({ data: results });
});

// GET /api/v1/analytics/low-stock?threshold=5
router.get('/low-stock', async (req, res) => {
  const threshold = parseInt(req.query.threshold || '5', 10);
  const items = await Item.find({ available_quantity: { $lte: threshold } }).sort({ available_quantity: 1 }).lean();
  res.json({ data: items });
});

module.exports = router;
