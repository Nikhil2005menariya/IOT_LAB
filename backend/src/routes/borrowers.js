const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Session = require('../models/Session');
const auth = require('../middleware/auth');

// GET /api/v1/borrowers?reg_no=XXXX
router.get('/', auth('admin'), async (req, res) => {
  const { reg_no } = req.query;

  const matchStage = {};
  if (reg_no) {
    matchStage.reg_no = { $regex: reg_no, $options: 'i' };
  }

  const borrowers = await Student.aggregate([
    { $match: matchStage },

    {
      $lookup: {
        from: 'sessions',
        localField: 'reg_no',
        foreignField: 'student_reg_no',
        as: 'sessions'
      }
    },

    {
      $addFields: {
        active_sessions: {
          $size: {
            $filter: {
              input: '$sessions',
              as: 's',
              cond: {
                $in: ['$$s.status', ['active', 'partial']]
              }
            }
          }
        },
        total_borrowed: {
          $sum: {
            $map: {
              input: '$sessions',
              as: 's',
              in: {
                $sum: {
                  $map: {
                    input: '$$s.items',
                    as: 'i',
                    in: '$$i.qty'
                  }
                }
              }
            }
          }
        }
      }
    },

    { $project: { sessions: 0 } },
    { $sort: { createdAt: -1 } },
    { $limit: 200 }
  ]);

  res.json({ data: borrowers });
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

// GET /api/v1/sessions/student/:reg_no
router.get('/student/:reg_no', auth('admin'), async (req, res) => {
  const sessions = await Session.find({
    student_reg_no: req.params.reg_no
  })
    .sort({ borrowed_at: -1 })
    .lean();

  res.json({ data: sessions });
});

module.exports = router;
