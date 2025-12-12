// src/models/Item.js
const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
  sku: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  description: { type: String },
  total_quantity: { type: Number, default: 0 },
  available_quantity: { type: Number, default: 0 },
  location: { type: String },
  tags: [String],
  condition: { type: String, default: 'good' }
}, { timestamps: true });

module.exports = mongoose.model('Item', ItemSchema);
