const mongoose = require('mongoose');

const appointmentHistorySchema = new mongoose.Schema({
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true
  },
  action: {
    type: String,
    enum: ['created', 'updated', 'cancelled', 'completed', 'no_show'],
    required: true
  },
  previousStatus: String,
  newStatus: String,
  reason: {
    code: String,
    detail: String
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  performedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('AppointmentHistory', appointmentHistorySchema); 