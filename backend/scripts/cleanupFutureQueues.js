const mongoose = require('mongoose');
const Queue = require('../models/Queue');
const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/maekcord';
mongoose.connect(uri);

async function convertStringDates() {
  const stringDateDocs = await Queue.find({ date: { $type: 'string' } });
  let converted = 0;
  for (const doc of stringDateDocs) {
    // Only convert if the string is a valid date
    const newDate = new Date(doc.date);
    if (!isNaN(newDate.getTime())) {
      await Queue.updateOne({ _id: doc._id }, { $set: { date: newDate } });
      converted++;
    }
  }
  console.log('Converted string date fields to Date:', converted);
}

async function cleanup() {
  await convertStringDates();
  const result = await Queue.deleteMany({ date: { $lt: new Date(new Date().setHours(0,0,0,0)) } });
  console.log('Deleted:', result.deletedCount);
  mongoose.disconnect();
}
cleanup();
