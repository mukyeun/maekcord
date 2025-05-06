const mongoose = require('mongoose');
const moment = require('moment-timezone');

const patientSchema = new mongoose.Schema({
  patientId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, '환자 이름은 필수입니다.'],
    trim: true
  },
  birthDate: {
    type: Date,
    required: [true, '생년월일은 필수입니다.']
  },
  gender: {
    type: String,
    required: [true, '성별은 필수입니다.'],
    enum: {
      values: ['male', 'female', 'other'],
      message: '유효하지 않은 성별입니다.'
    }
  },
  contact: {
    phone: {
      type: String,
      required: [true, '연락처는 필수입니다.'],
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, '유효한 이메일 주소를 입력해주세요.']
    },
    address: {
      type: String,
      trim: true
    }
  },
  status: {
    type: String,
    enum: {
      values: ['active', 'inactive'],
      message: '유효하지 않은 상태값입니다.'
    },
    default: 'active'
  },
  inactiveReason: String,
  medicalInfo: {
    bloodType: {
      type: String,
      enum: {
        values: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'],
        message: '유효하지 않은 혈액형입니다.'
      }
    },
    allergies: [String],
    medications: [String],
    conditions: [String]
  },
  activityLog: [{
    type: {
      type: String,
      required: true
    },
    description: String,
    createdAt: {
      type: Date,
      default: Date.now
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  }],
  lastVisit: Date,
  nextAppointment: Date,
  memo: String
}, {
  timestamps: true
});

// 인덱스 설정
patientSchema.index({ patientId: 1 }, { unique: true });
patientSchema.index({ name: 1 });
patientSchema.index({ 'contact.phone': 1 });
patientSchema.index({ status: 1 });

// 가상 필드: 나이 계산
patientSchema.virtual('age').get(function() {
  return moment().diff(this.birthDate, 'years');
});

// 활동 로그 추가 메서드
patientSchema.methods.addActivityLog = function(type, description, userId) {
  this.activityLog.push({
    type,
    description,
    createdBy: userId
  });
};

// 환자 ID 자동 생성 (저장 전)
patientSchema.pre('save', async function(next) {
  if (this.isNew) {
    const today = moment().format('YYMMDD');
    const lastPatient = await this.constructor.findOne({
      patientId: new RegExp(`^${today}`)
    }).sort({ patientId: -1 });

    let sequence = '001';
    if (lastPatient) {
      const lastSequence = parseInt(lastPatient.patientId.slice(-3));
      sequence = String(lastSequence + 1).padStart(3, '0');
    }

    this.patientId = `${today}${sequence}`;
  }
  next();
});

const Patient = mongoose.model('Patient', patientSchema);

module.exports = Patient;