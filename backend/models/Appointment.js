const mongoose = require('mongoose');
const moment = require('moment-timezone');

const appointmentSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, '환자 정보는 필수입니다.']
  },
  dateTime: {
    type: Date,
    required: [true, '예약 일시는 필수입니다.']
  },
  duration: {
    type: Number,
    default: 30,
    min: [15, '최소 예약 시간은 15분입니다.'],
    max: [180, '최대 예약 시간은 180분입니다.']
  },
  type: {
    type: String,
    required: [true, '예약 유형은 필수입니다.'],
    enum: {
      values: ['initial', 'follow_up', 'consultation', 'treatment', 'test'],
      message: '유효하지 않은 예약 유형입니다.'
    }
  },
  status: {
    type: String,
    enum: {
      values: ['scheduled', 'completed', 'cancelled', 'no_show'],
      message: '유효하지 않은 상태값입니다.'
    },
    default: 'scheduled'
  },
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancelReason: String,
  completedAt: Date,
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  lastReminderDate: Date
}, {
  timestamps: true
});

// 인덱스 설정
appointmentSchema.index({ patientId: 1, dateTime: 1 });
appointmentSchema.index({ dateTime: 1 });
appointmentSchema.index({ status: 1 });

// 가상 필드: 예약까지 남은 시간 (분)
appointmentSchema.virtual('timeUntil').get(function() {
  return moment(this.dateTime).diff(moment(), 'minutes');
});

// 예약 시간 중복 체크 (저장 전)
appointmentSchema.pre('save', async function(next) {
  if (!this.isModified('dateTime')) return next();

  const startTime = moment(this.dateTime);
  const endTime = moment(this.dateTime).add(this.duration, 'minutes');

  const existingAppointment = await this.constructor.findOne({
    _id: { $ne: this._id },
    dateTime: {
      $gte: startTime.toDate(),
      $lt: endTime.toDate()
    },
    status: 'scheduled'
  });

  if (existingAppointment) {
    next(new Error('해당 시간에 이미 예약이 있습니다.'));
  }

  next();
});

// 상태 변경 시 관련 필드 자동 업데이트
appointmentSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    if (this.status === 'completed') {
      this.completedAt = new Date();
    }
  }
  next();
});

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment;