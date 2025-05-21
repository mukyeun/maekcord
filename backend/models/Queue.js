const mongoose = require('mongoose');

const queueSchema = new mongoose.Schema({
  queueNumber: {
    type: String,
    required: true,
    unique: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  name: { type: String, required: true },
  visitType: { type: String, enum: ['초진', '재진'], default: '초진' },
  birthDate: String,
  phone: String,
  symptoms: [String],
  stressLevel: String,
  status: {
    type: String,
    enum: ['waiting', 'called', 'consulting', 'completed'],
    default: 'waiting'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Queue', queueSchema);
