// backend/src/seed/createUsers.js
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');

mongoose.connect('mongodb://localhost:27017/iot_lab');

async function run() {
  await User.deleteMany({});
  await User.create([
    {
      username: 'system',
      password: await bcrypt.hash('system123', 10),
      role: 'system'
    },
    {
      username: 'admin',
      password: await bcrypt.hash('admin123', 10),
      role: 'admin'
    }
  ]);
  console.log('Users created');
  process.exit();
}

run();
