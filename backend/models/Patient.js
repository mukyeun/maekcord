const mongoose = require('mongoose');
const moment = require('moment-timezone');

const RecordSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  symptoms: [String],
  medications: [String],
  memo: String,
  stress: {
    level: {
      type: String,
      enum: ['low', 'normal', 'high', '낮음', '보통', '높음'],
      default: 'normal'
    },
    score: {
      type: Number,
      default: 0
    },
    items: [{
      name: String,
      score: Number
    }],
    measuredAt: {
      type: Date,
      default: Date.now
    }
  },
  pulseAnalysis: String,
  pulseWave: {
    systolicBP: Number,
    diastolicBP: Number,
    heartRate: Number,
    pulsePressure: Number,
    'a-b': Number, 'a-c': Number, 'a-d': Number, 'a-e': Number,
    'b/a': Number, 'c/a': Number, 'd/a': Number, 'e/a': Number,
    elasticityScore: Number,
    PVC: Number,
    BV: Number,
    SV: Number,
    lastUpdated: { type: Date, default: Date.now }
  },
  macSang: {
    floating: Boolean, sunken: Boolean, slow: Boolean, rapid: Boolean,
    slippery: Boolean, rough: Boolean, string: Boolean, scattered: Boolean,
    notes: String
  }
});

const patientSchema = new mongoose.Schema({
  patientId: {
    type: String,
    required: false,
    unique: true,
    sparse: true
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
    gender: {
      type: String,
      enum: ['male', 'female', ''],
      required: true,
      default: ''
    },
    residentNumber: {
      type: String,
      default: ''
    },
    birthDate: {
      type: Date,
      default: null
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
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  symptoms: {
    type: [String],
    default: []
  },
  medication: {
    current: [String],
    history: [String],
    medications: [String],
    preferences: [String]
  },
  stress: {
    level: {
      type: String,
      enum: ['low', 'normal', 'high', '낮음', '보통', '높음'],
      default: 'normal'
    },
    score: {
      type: Number,
      default: 0
    },
    items: [{
      name: String,
      score: Number
    }],
    measuredAt: {
      type: Date,
      default: Date.now
    }
  },
  records: [RecordSchema],
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
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  versionKey: false
});

// ✅ updatedAt 자동 갱신
patientSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// ✅ 활동 로그 메서드
patientSchema.methods.addActivityLog = function (action, description, userId) {
  this.activityLog.push({
    action,
    description,
    userId: userId || 'system'
  });
};

// ✅ 나이 계산
patientSchema.virtual('age').get(function () {
  if (!this.basicInfo.birthDate) return null;
  return moment().diff(this.basicInfo.birthDate, 'years');
});

// ✅ 인덱스
patientSchema.index({ patientId: 1 }, { unique: true });
patientSchema.index({ 'basicInfo.name': 1 });
patientSchema.index({ createdAt: -1 });

// ✅ 고유 ID 생성 메서드
patientSchema.statics.generateUniqueId = async function () {
  let attempts = 0;
  const maxAttempts = 5;

  while (attempts < maxAttempts) {
    const now = new Date();
    const ymd = now.toISOString().slice(2, 10).replace(/-/g, '');
    const millis = now.getMilliseconds().toString().padStart(3, '0');
    const rand = Math.floor(1000 + Math.random() * 9000);
    const candidateId = `P${ymd}${millis}${rand}`;

    const exists = await this.exists({ patientId: candidateId });
    if (!exists) return candidateId;

    attempts++;
  }

  throw new Error('고유한 환자 ID 생성 실패');
};

const Patient = mongoose.model('Patient', patientSchema);
module.exports = Patient;
