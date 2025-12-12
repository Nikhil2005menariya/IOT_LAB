// backend/src/models/Session.js
const mongoose = require('mongoose');

const SessionItemSchema = new mongoose.Schema({
  item_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
  sku: String,
  name: String,
  qty: { type: Number, default: 0 }
}, { _id: false });

const ReturnedItemSchema = new mongoose.Schema({
  item_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
  qty: { type: Number, default: 0 },
  returned_at: Date
}, { _id: false });

const SessionSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  student_reg_no: String,
  items: [SessionItemSchema],
  status: { type: String, enum: ['active','partial','returned'], default: 'active' },
  borrowed_at: { type: Date, default: Date.now },
  due_date: Date,
  returned_at: Date,
  returned_items: [ReturnedItemSchema],
  createdBy: String,
  notes: String
}, { timestamps: true });

// safe export: use existing model if compiled (works with nodemon / HMR)
module.exports = mongoose.models.Session || mongoose.model('Session', SessionSchema);
