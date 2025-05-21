const mongoose = require('mongoose');
const moment = require('moment-timezone');

const patientSchema = new mongoose.Schema({
  // ✅ patientId - required 제거
  patientId: {
    type: String,
    unique: true,
    trim: true
  },
  basicInfo: {
    name: { 
      type: String, 
      required: true,
      trim: true
    },
    residentNumber: {
      type: String,
      trim: true
    },
    gender: String,
    phone: {
      type: String,
      trim: true
    },
    birthDate: Date,
    visitType: {
      type: String,
      enum: ['초진', '재진'],
      default: '초진'
    },
    personality: String,
    workIntensity: String,
    height: String,
    weight: String,
    bmi: String
  },
  medication: {
    medications: {
      type: [String],
      default: []
    },
    preferences: {
      type: [String],
      default: []
    }
  },
  symptoms: {
    type: [String],
    default: []
  },
  memo: {
    type: String,
    trim: true
  },
  records: {
    pulseWave: mongoose.Schema.Types.Mixed,
    stress: mongoose.Schema.Types.Mixed
  },
  activityLog: [{
    action: String,
    description: String,
    userId: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// ✅ patientId 자동 생성 로직
patientSchema.pre('save', async function(next) {
  try {
    // patientId가 없거나 빈 값이면 자동 생성
    if (!this.patientId || typeof this.patientId !== 'string' || this.patientId.trim() === '') {
      const today = moment().format('YYMMDD');
      
      // 오늘 날짜의 마지막 환자 ID 조회
      const lastPatient = await this.constructor.findOne({
        patientId: new RegExp(`^${today}`)
      }).sort({ patientId: -1 });

      // 순번 생성 (001부터 시작)
      let sequence = '001';
      if (lastPatient?.patientId) {
        const lastSeq = parseInt(lastPatient.patientId.slice(-3), 10);
        sequence = String(lastSeq + 1).padStart(3, '0');
      }

      // 새로운 patientId 설정
      this.patientId = `${today}${sequence}`;
      console.log('✅ 새로운 환자 ID 생성됨:', this.patientId);
    }

    next();
  } catch (error) {
    console.error('❌ 환자 ID 생성 실패:', error);
    next(error);
  }
});

// ✅ 활동 로그 추가 메서드
patientSchema.methods.addActivityLog = function(action, description, userId) {
  this.activityLog.push({
    action,
    description,
    userId: userId || 'system'
  });
};

// ✅ 필요한 인덱스 설정
patientSchema.index({ patientId: 1 }, { unique: true });
patientSchema.index({ 'basicInfo.name': 1 });
patientSchema.index({ createdAt: -1 });

// ✅ 가상 필드: 나이 계산
patientSchema.virtual('age').get(function() {
  return moment().diff(this.basicInfo.birthDate, 'years');
});

const Patient = mongoose.model('Patient', patientSchema);
module.exports = Patient;
