// src/index.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');

const itemsRouter = require('./routes/items');
const studentsRouter = require('./routes/students');
const sessionsRouter = require('./routes/sessions');
const analyticsRouter = require('./routes/analytics');

const app = express();
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

// basic health route
app.get('/health', (req, res) => res.json({ status: 'ok', ts: new Date() }));

// api prefix
app.use('/api/v1/items', itemsRouter);
app.use('/api/v1/students', studentsRouter);
app.use('/api/v1/sessions', sessionsRouter);
app.use('/api/v1/analytics', analyticsRouter);

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/iot_lab';

mongoose.connect(MONGO_URI).then(() => {
  console.log('MongoDB connected');
  app.listen(PORT, () => console.log(`Backend listening on port ${PORT}`));
}).catch(err => {
  console.error('MongoDB connection failed:', err);
  process.exit(1);
});

