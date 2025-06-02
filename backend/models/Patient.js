const mongoose = require('mongoose');
const moment = require('moment-timezone');

const patientSchema = new mongoose.Schema({
  patientId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  birthDate: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    enum: ['male', 'female'],
    required: true
  },
  contact: {
    phone: String,
    email: String,
    address: String
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  basicInfo: {
    name: {
      type: String,
      required: [true, '환자 이름은 필수입니다.'],
      trim: true
    },
    phone: {
      type: String,
      default: ''
    },
    birthDate: {
      type: String,
      default: ''
    },
    gender: {
      type: String,
      enum: ['male', 'female', ''],  // 빈 문자열도 허용
      default: ''
    },
    residentNumber: {
      type: String,
      trim: true,
      default: ''
    },
    visitType: {
      type: String,
      enum: ['초진', '재진'],
      default: '초진'
    },
    personality: {
      type: String,
      default: ''
    },
    workIntensity: {
      type: String,
      default: ''
    },
    height: {
      type: String,
      default: ''
    },
    weight: {
      type: String,
      default: ''
    },
    bmi: {
      type: String,
      default: ''
    }
  },
  symptoms: {
    type: [String],
    default: []
  },
  medication: {
    type: Object,
    default: {}
  },
  records: {
    pulseWave: {
      systolicBP: Number,
      diastolicBP: Number,
      heartRate: Number,
      pulsePressure: Number,
      'a-b': Number,
      'a-c': Number,
      'a-d': Number,
      'a-e': Number,
      'b/a': Number,
      'c/a': Number,
      'd/a': Number,
      'e/a': Number,
      elasticityScore: Number,
      PVC: String,
      BV: String,
      SV: String,
      lastUpdated: Date
    },
    stress: {
      items: [String],
      totalScore: Number,
      level: String,
      description: String,
      details: String
    }
  },
  memo: {
    type: String,
    default: ''
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
  timestamps: true,
  versionKey: false
});

// 환자 ID 자동 생성
patientSchema.pre('save', async function(next) {
  if (this.isNew) {
    const today = new Date();
    const year = today.getFullYear().toString().slice(-2);
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    
    // 오늘 등록된 환자 수 조회
    const count = await this.constructor.countDocuments({
      createdAt: {
        $gte: new Date(today.setHours(0, 0, 0, 0)),
        $lt: new Date(today.setHours(23, 59, 59, 999))
      }
    });
    
    // P + YYMMDD + 일련번호(3자리)
    this.patientId = `P${year}${month}${day}${(count + 1).toString().padStart(3, '0')}`;
  }
  console.log('🔍 저장 전 데이터 검증:', {
    'basicInfo 존재': !!this.basicInfo,
    'name 존재': !!this.basicInfo?.name,
    'name 값': this.basicInfo?.name,
    'gender 값': this.basicInfo?.gender,
    'symptoms 타입': Array.isArray(this.symptoms),
    'symptoms 길이': this.symptoms?.length
  });

  // 1. 필수 필드 검증
  if (!this.basicInfo?.name?.trim()) {
    next(new Error('환자 이름은 필수입니다.'));
    return;
  }

  // 2. gender 값 검증
  if (this.basicInfo?.gender && !['male', 'female', ''].includes(this.basicInfo.gender)) {
    next(new Error('성별은 male 또는 female이어야 합니다.'));
    return;
  }

  // 3. symptoms 배열 검증
  if (this.symptoms && !Array.isArray(this.symptoms)) {
    next(new Error('symptoms는 배열이어야 합니다.'));
    return;
  }

  // 4. 데이터 로깅
  console.log('🔍 저장 전 데이터 검증:', {
    'basicInfo 존재': !!this.basicInfo,
    'name 존재': !!this.basicInfo?.name,
    'name 값': this.basicInfo?.name,
    'gender 값': this.basicInfo?.gender,
    'symptoms 타입': Array.isArray(this.symptoms),
    'symptoms 길이': this.symptoms?.length
  });

  next();
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
