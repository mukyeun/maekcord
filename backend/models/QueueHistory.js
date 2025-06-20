const mongoose = require('mongoose');

const queueHistorySchema = new mongoose.Schema({
  queueId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Queue',
    required: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  previousStatus: {
    type: String,
    required: true
  },
  newStatus: {
    type: String,
    required: true
  },
  changedBy: {
    type: String,  // 또는 mongoose.Schema.Types.ObjectId
    required: true
  },
  changedAt: {
    type: Date,
    default: Date.now
  },
  reason: String
}, {
  timestamps: true
});

// 인덱스 추가
queueHistorySchema.index({ queueId: 1, changedAt: -1 });
queueHistorySchema.index({ patientId: 1, changedAt: -1 });

const QueueHistory = mongoose.model('QueueHistory', queueHistorySchema);

module.exports = QueueHistory; 