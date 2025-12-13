const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Item = require('../models/Item');
const Session = require('../models/Session');
const auth = require('../middleware/auth');

// Optional Event model
let Event = null;
try {
  Event = require('../models/Event');
} catch (e) {
  Event = null;
}

/**
 * GET /api/v1/items
 * Optional:
 *   ?q=searchText
 *   ?limit=200
 */
router.get('/', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    const limit = Math.min(200, Number(req.query.limit || 200));
    const filter = {};

    if (q) {
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
 * ADMIN ONLY
 * Body: { sku, name, description, total_quantity }
 */
router.post('/', auth('admin'), async (req, res) => {
  try {
    const { sku, name, description, total_quantity = 0 } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }

    const total = Math.max(0, Number(total_quantity) || 0);

    const it = new Item({
      sku,
      name,
      description,
      total_quantity: total,
      available_quantity: total
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
 * ADMIN ONLY
 * Update metadata (name, description, sku, etc.)
 */
router.put('/:id', auth('admin'), async (req, res) => {
  try {
    const updated = await Item.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).lean();

    if (!updated) return res.status(404).json({ error: 'Item not found' });
    return res.json({ item: updated });
  } catch (err) {
    console.error('PUT /items/:id error', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
});

/**
 * POST /api/v1/items/:id/update-quantity
 * ADMIN ONLY
 * Body: { change: Number, user?: String }
 *
 * change > 0  => add stock
 * change < 0  => remove stock
 */
router.post('/:id/update-quantity', auth('admin'), async (req, res) => {
  try {
    const itemId = req.params.id;
    const change = Number(req.body.change);
    const user = req.body.user || 'admin';

    if (!Number.isFinite(change) || change === 0) {
      return res.status(400).json({ error: 'change (non-zero number) is required' });
    }

    const item = await Item.findById(itemId);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    const newAvailable = item.available_quantity + change;
    const newTotal = item.total_quantity + change;

    if (newAvailable < 0) {
      return res.status(400).json({ error: 'available_quantity cannot go negative' });
    }
    if (newTotal < 0) {
      return res.status(400).json({ error: 'total_quantity cannot go negative' });
    }

    item.available_quantity = newAvailable;
    item.total_quantity = newTotal;
    await item.save();

    // Optional event logging
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
      } catch (e) {
        console.warn('Event log failed (non-blocking)', e);
      }
    }

    return res.json({ item });
  } catch (err) {
    console.error('POST /items/:id/update-quantity error', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
});

/**
 * DELETE /api/v1/items/:id
 * ADMIN ONLY
 * Safety: cannot delete item if currently borrowed
 */
router.delete('/:id', auth('admin'), async (req, res) => {
  try {
    const itemId = req.params.id;

    const active = await Session.findOne({
      'items.item_id': itemId,
      status: { $in: ['active', 'partial'] }
    });

    if (active) {
      return res.status(400).json({
        error: 'Item cannot be deleted while it is borrowed'
      });
    }

    const deleted = await Item.findByIdAndDelete(itemId);
    if (!deleted) return res.status(404).json({ error: 'Item not found' });

    return res.json({ success: true });
  } catch (err) {
    console.error('DELETE /items/:id error', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
});

module.exports = router;
