const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  type: { type: String, enum: ['borrow','return'], required: true },
  session_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
  item_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  qty: { type: Number, required: true },
  user: String,
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.models.Event || mongoose.model('Event', EventSchema);
