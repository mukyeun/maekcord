require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Queue = require('../models/Queue');

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/maekcord';
mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });

async function fixPatientIds() {
  const queues = await Queue.find({ patientId: { $type: 'string' } });
  for (const queue of queues) {
    try {
      if (/^[a-fA-F0-9]{24}$/.test(queue.patientId)) {
        queue.patientId = new mongoose.Types.ObjectId(queue.patientId);
        await queue.save();
        console.log(`Fixed queue: ${queue._id}`);
      } else {
        console.warn(`Skipped queue: ${queue._id} (patientId: ${queue.patientId})`);
      }
    } catch (e) {
      console.error(`Error fixing queue: ${queue._id}`, e);
    }
  }
  mongoose.disconnect();
}

fixPatientIds();
