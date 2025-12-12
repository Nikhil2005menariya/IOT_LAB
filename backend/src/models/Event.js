// src/models/Event.js
const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  type: { type: String, enum: ['borrow','return','adjust'], required: true },
  session_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
  item_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
  qty: Number,
  timestamp: { type: Date, default: Date.now },
  user: String
});

module.exports = mongoose.model('Event', EventSchema);
