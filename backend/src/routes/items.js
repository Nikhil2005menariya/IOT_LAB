// backend/src/routes/items.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Item = require('../models/Item');
// Event model is optional — if you don't have it, comments below explain how it's handled
let Event = null;
try {
  Event = require('../models/Event');
} catch (e) {
  // Event model not present — that's OK, we will skip event creation where appropriate.
  Event = null;
}

/**
 * GET /api/v1/items
 * Optional query:
 *   ?q=searchText   (uses $text search if you create a text index on name/sku/description)
 *   ?limit=100
 */
router.get('/', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    const limit = Math.min(200, Number(req.query.limit || 200));
    const filter = {};

    if (q) {
      // If you create a text index on Item (e.g. { name: "text", sku: "text", description: "text" })
      // you can uncomment the line below to use $text search. Otherwise use regex fallback.
      // filter.$text = { $search: q };

      // Regex fallback (case-insensitive contains)
      const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ name: re }, { sku: re }, { description: re }];
    }

    const items = await Item.find(filter).limit(limit).lean();
    return res.json({ data: items });
  } catch (err) {
    console.error('GET /items error', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
});

/**
 * GET /api/v1/items/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const it = await Item.findById(req.params.id).lean();
    if (!it) return res.status(404).json({ error: 'Item not found' });
    return res.json({ data: it });
  } catch (err) {
    console.error('GET /items/:id error', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
});

/**
 * POST /api/v1/items
 * Body: { sku, name, description, total_quantity, available_quantity (optional), location, metadata }
 */
router.post('/', async (req, res) => {
  try {
    const { sku, name, description, total_quantity = 0, available_quantity, location, metadata } = req.body;

    if (!name) return res.status(400).json({ error: 'name is required' });

    const total = Number(total_quantity) || 0;
    const available = typeof available_quantity !== 'undefined' ? Number(available_quantity) : total;

    const it = new Item({
      sku,
      name,
      description,
      total_quantity: Math.max(0, total),
      available_quantity: Math.max(0, available),
      location,
      metadata
    });

    await it.save();
    return res.status(201).json({ item: it });
  } catch (err) {
    console.error('POST /items error', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
});

/**
 * PUT /api/v1/items/:id
 * Replace or patch fields of an item
 */
router.put('/:id', async (req, res) => {
  try {
    const updated = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).lean();
    if (!updated) return res.status(404).json({ error: 'Item not found' });
    return res.json({ item: updated });
  } catch (err) {
    console.error('PUT /items/:id error', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
});

/**
 * POST /api/v1/items/:id/update-quantity
 * Body: { change: Number, user?: String }
 *
 * change: signed integer. Positive => add stock. Negative => remove stock.
 * Updates both available_quantity and total_quantity (total_quantity reflects owned stock).
 * Validation: prevents available_quantity or total_quantity from going negative.
 */
router.post('/:id/update-quantity', async (req, res) => {
  try {
    const itemId = req.params.id;
    const change = Number(req.body.change);
    const user = req.body.user || 'system';

    if (!Number.isFinite(change) || change === 0) {
      return res.status(400).json({ error: 'change (non-zero number) is required' });
    }

    // Load item doc
    const item = await Item.findById(itemId);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    const newAvailable = item.available_quantity + change;
    const newTotal = item.total_quantity + change;

    if (newAvailable < 0) {
      return res.status(400).json({ error: 'Resulting available_quantity would be negative' });
    }
    if (newTotal < 0) {
      return res.status(400).json({ error: 'Resulting total_quantity would be negative' });
    }

    item.available_quantity = newAvailable;
    item.total_quantity = newTotal;
    await item.save();

    // Optionally log adjustment as an Event (non-blocking)
    if (Event && Event.create) {
      try {
        await Event.create({
          type: 'adjust',
          session_id: null,
          item_id: new mongoose.Types.ObjectId(item._id),
          qty: change,
          user,
          timestamp: new Date()
        });
      } catch (evErr) {
        console.warn('Event log failed for inventory adjust', evErr);
      }
    }

    return res.json({ item });
  } catch (err) {
    console.error('POST /items/:id/update-quantity error', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
});

module.exports = router;
