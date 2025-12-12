// src/seed/seed.js
require('dotenv').config();
const mongoose = require('mongoose');
const Item = require('../models/Item');
const Student = require('../models/Student');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/iot_lab';

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('connected to mongo for seeding');

  await Item.deleteMany({});
  await Student.deleteMany({});

  const items = [
    { sku: 'SEN-001', name: 'DHT11 Sensor', total_quantity: 30, available_quantity: 30, location: 'Shelf A1' },
    { sku: 'BRD-UNO', name: 'Arduino UNO', total_quantity: 20, available_quantity: 20, location: 'Shelf A2' },
    { sku: 'RES-1K', name: 'Resistor 1k pack', total_quantity: 150, available_quantity: 150, location: 'Box B1' }
  ];

  await Item.insertMany(items);
  await Student.create({ reg_no: '1162', name: 'Nikhil' });

  console.log('seeding done');
  await mongoose.disconnect();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
