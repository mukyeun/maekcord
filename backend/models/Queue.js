const mongoose = require('mongoose');

const queueSchema = new mongoose.Schema({
  queueNumber: {
    type: String,
    required: true,
    unique: true
  },
  date: {
    type: String,
    required: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  visitType: {
    type: String,
    enum: ['초진', '재진'],
    required: true,
    default: '초진'
  },
  birthDate: {
    type: Date
  },
  phone: {
    type: String
  },
  symptoms: {
    type: [String],
    default: []
  },
  status: {
    type: String,
    enum: ['waiting', 'called', 'consulting', 'completed'],
    default: 'waiting'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 인덱스 설정
queueSchema.index({ queueNumber: 1, date: 1 }, { unique: true });
queueSchema.index({ status: 1 });
queueSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Queue', queueSchema);
