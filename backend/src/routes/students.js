// src/routes/students.js
const express = require('express');
const router = express.Router();
const Student = require('../models/Student');

// GET /api/v1/students/:reg_no
router.get('/:reg_no', async (req, res) => {
  const s = await Student.findOne({ reg_no: req.params.reg_no });
  if (!s) return res.status(404).json({ error: 'Student not found' });
  res.json(s);
});

// POST /api/v1/students
router.post('/', async (req, res) => {
  const s = new Student(req.body);
  await s.save();
  res.status(201).json(s);
});

module.exports = router;
