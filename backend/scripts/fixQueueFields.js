const mongoose = require('mongoose');
const Queue = require('../models/Queue');

const MONGO_URI = 'mongodb://127.0.0.1:27017/maekcord';

async function fixQueues() {
  await mongoose.connect(MONGO_URI);

  const queues = await Queue.find({
    $or: [
      { date: { $exists: false } },
      { sequenceNumber: { $exists: false } }
    ]
  });

  for (const q of queues) {
    // date 보정
    if (typeof q.date === 'string') {
      q.date = new Date(q.date + 'T00:00:00.000Z');
    } else if (!q.date && q.createdAt) {
      const d = new Date(q.createdAt);
      d.setHours(0,0,0,0);
      q.date = d;
    } else if (!q.date) {
      q.date = new Date();
    }

    // sequenceNumber 보정
    if (!q.sequenceNumber && q.queueNumber) {
      const match = q.queueNumber.match(/-(\d{3})$/);
      if (match) {
        q.sequenceNumber = parseInt(match[1], 10);
      } else {
        q.sequenceNumber = 1;
      }
    } else if (!q.sequenceNumber) {
      q.sequenceNumber = 1;
    }

    // status 보정 (대문자 → 소문자)
    if (typeof q.status === 'string') {
      q.status = q.status.toLowerCase();
    }

    await q.save();
  }

  await mongoose.disconnect();
}

fixQueues().catch(console.error);