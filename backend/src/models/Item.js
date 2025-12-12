// backend/src/models/Item.js
const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
  sku: { type: String, index: true },
  name: { type: String, required: true },
  description: { type: String },
  total_quantity: { type: Number, default: 0 },
  available_quantity: { type: Number, default: 0 },
  location: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

// safe export: prevent OverwriteModelError during reloads
module.exports = mongoose.models.Item || mongoose.model('Item', ItemSchema);
