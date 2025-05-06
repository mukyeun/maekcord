const mongoose = require('mongoose');
const moment = require('moment-timezone');

const waitlistSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, '환자 정보는 필수입니다.']
  },
  status: {
    type: String,
    enum: {
      values: ['waiting', 'called', 'cancelled', 'completed'],
      message: '유효하지 않은 상태값입니다.'
    },
    default: 'waiting'
  },
  priority: {
    type: Number,
    default: 1,
    min: [1, '우선순위는 1 이상이어야 합니다.']
  },
  estimatedTime: {
    type: Date
  },
  note: String,
  registeredAt: {
    type: Date,
    default: Date.now
  },
  registeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  calledAt: Date,
  completedAt: Date,
  statusChangedAt: Date,
  statusChangedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  statusNote: String,
  date: {
    type: Date,
    required: true,
    default: () => moment().startOf('day').toDate()
  }
}, {
  timestamps: true
});

// 인덱스 설정
waitlistSchema.index({ patientId: 1, date: 1 });
waitlistSchema.index({ status: 1 });
waitlistSchema.index({ priority: -1, registeredAt: 1 });

// 가상 필드: 대기 시간 (분)
waitlistSchema.virtual('waitTime').get(function() {
  if (this.calledAt) {
    return moment(this.calledAt).diff(this.registeredAt, 'minutes');
  }
  return moment().diff(this.registeredAt, 'minutes');
});

const Waitlist = mongoose.model('Waitlist', waitlistSchema);

module.exports = Waitlist; 