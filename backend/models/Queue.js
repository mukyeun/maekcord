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
    enum: ['waiting', 'called', 'consulting', 'done'],
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
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 인덱스 추가
queueSchema.index({ date: 1, queueNumber: 1 }, { unique: true });
queueSchema.index({ date: 1, status: 1 });

// 저장 전 검증
queueSchema.pre('save', function(next) {
  if (!this.date || !this.queueNumber) {
    next(new Error('날짜와 대기번호는 필수입니다.'));
    return;
  }
  next();
});

// Virtual populate를 위한 설정
queueSchema.virtual('patientInfo', {
  ref: 'Patient',
  localField: 'patientId',
  foreignField: '_id',
  justOne: true
});

module.exports = mongoose.model('Queue', queueSchema);
