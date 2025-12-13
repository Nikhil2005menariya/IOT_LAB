const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Session = require('../models/Session');
const auth = require('../middleware/auth');

// GET /api/v1/borrowers?reg_no=XXXX
router.get('/', auth('admin'), async (req, res) => {
  const { reg_no } = req.query;

  const filter = {};
  if (reg_no) {
    filter.reg_no = { $regex: reg_no, $options: 'i' };
  }

  const students = await Student.find(filter)
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();

  res.json({ data: students });
});

// GET /api/v1/borrowers/:id
router.get('/:id', auth('admin'), async (req, res) => {
  const student = await Student.findById(req.params.id).lean();
  if (!student) return res.status(404).json({ error: 'Student not found' });

  const sessions = await Session.find({ student_id: student._id })
    .sort({ borrowed_at: -1 })
    .lean();

  res.json({
    student,
    sessions
  });
});

module.exports = router;
