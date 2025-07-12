const mongoose = require('mongoose');
const moment = require('moment-timezone');

const appointmentSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, '환자 정보는 필수입니다.']
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '의사 정보는 필수입니다.']
  },
  appointmentDate: {
    type: Date,
    required: [true, '예약 일시는 필수입니다.']
  },
  duration: {
    type: Number,
    default: 30,
    min: [15, '최소 예약 시간은 15분입니다.'],
    max: [120, '최대 예약 시간은 120분입니다.']
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled', 'no-show'],
    default: 'scheduled'
  },
  type: {
    type: String,
    enum: ['initial', 'follow-up', 'emergency'],
    required: [true, '예약 유형은 필수입니다.']
  },
  description: {
    type: String,
    maxLength: [500, '설명은 500자를 초과할 수 없습니다.']
  },
  symptoms: [{
    type: String,
    maxLength: [100, '증상은 100자를 초과할 수 없습니다.']
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: String,
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
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 인덱스 설정
appointmentSchema.index({ patientId: 1, appointmentDate: 1 });
appointmentSchema.index({ doctorId: 1, appointmentDate: 1 });
appointmentSchema.index({ status: 1 });

// 가상 필드: 예약 종료 시간
appointmentSchema.virtual('endTime').get(function() {
  return new Date(this.appointmentDate.getTime() + this.duration * 60000);
});

// 중복 예약 방지를 위한 미들웨어
appointmentSchema.pre('save', async function(next) {
  if (!this.isModified('appointmentDate') && !this.isModified('duration')) {
    return next();
  }

  const endTime = this.endTime;
  
  // 같은 의사의 겹치는 시간대 예약 확인
  const conflictingAppointment = await this.constructor.findOne({
    doctorId: this.doctorId,
    _id: { $ne: this._id },
    status: 'scheduled',
    $or: [
      {
        appointmentDate: { 
          $lt: endTime,
          $gte: this.appointmentDate 
        }
      },
      {
        $expr: {
          $and: [
            { $lt: ['$appointmentDate', this.appointmentDate] },
            { 
              $gt: [
                { $add: ['$appointmentDate', { $multiply: ['$duration', 60000] }] },
                this.appointmentDate
              ]
            }
          ]
        }
      }
    ]
  });

  if (conflictingAppointment) {
    throw new Error('해당 시간에 이미 다른 예약이 있습니다.');
  }

  next();
});

// 예약 취소 시 상태 변경 메서드
appointmentSchema.methods.cancel = async function(userId) {
  this.status = 'cancelled';
  this.updatedBy = userId;
  await this.save();
};

// 예약 완료 처리 메서드
appointmentSchema.methods.complete = async function(userId) {
  this.status = 'completed';
  this.updatedBy = userId;
  await this.save();
};

// 노쇼 처리 메서드
appointmentSchema.methods.markNoShow = async function(userId) {
  this.status = 'no-show';
  this.updatedBy = userId;
  await this.save();
};

// 의사의 특정 날짜 예약 현황 조회
appointmentSchema.statics.getDoctorSchedule = async function(doctorId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return this.find({
    doctorId,
    appointmentDate: {
      $gte: startOfDay,
      $lte: endOfDay
    }
  }).populate('patientId', 'name dateOfBirth gender');
};

// 환자의 예약 이력 조회
appointmentSchema.statics.getPatientHistory = async function(patientId) {
  return this.find({
    patientId
  })
  .sort({ appointmentDate: -1 })
  .populate('doctorId', 'name department');
};

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment;