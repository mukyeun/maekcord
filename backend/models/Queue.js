const mongoose = require('mongoose');

const queueSchema = new mongoose.Schema({
  date: {
    type: String,
    required: [true, '날짜는 필수입니다.']
  },
  queueNumber: {
    type: String,
    required: [true, '대기번호는 필수입니다.']
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, '환자 ID는 필수입니다.']
  },
  name: {
    type: String,
    required: [true, '환자 이름은 필수입니다.']
  },
  visitType: {
    type: String,
    enum: ['초진', '재진'],
    default: '초진'
  },
  symptoms: {
    type: [String],
    default: []
  },
  status: {
    type: String,
    enum: ['waiting', 'inProgress', 'done'],
    default: 'waiting'
  },
  memo: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 인덱스 추가
queueSchema.index({ date: 1, queueNumber: 1 }, { unique: true });
queueSchema.index({ date: 1, status: 1 });

// 저장 전 검증
queueSchema.pre('save', function(next) {
  if (!this.date || !this.queueNumber || !this.name) {
    next(new Error('날짜, 대기번호, 환자 이름은 필수입니다.'));
    return;
  }
  next();
});

module.exports = mongoose.model('Queue', queueSchema);
