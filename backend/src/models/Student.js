// src/models/Student.js
const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  reg_no: { type: String, required: true, unique: true, trim: true },
  name: String,
  email: String,
  phone: String,
  department: String
}, { timestamps: true });

module.exports = mongoose.model('Student', StudentSchema);
