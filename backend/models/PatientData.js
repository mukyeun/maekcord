const mongoose = require('mongoose');
const moment = require('moment-timezone');

// 환자 기본 정보 스키마
const basicInfoSchema = new mongoose.Schema({
  // 개인 식별 정보
  patientId: {
    type: String,
    unique: true,
    required: true
    // P + YYYYMMDD + 4자리 순번
    // 예: P202504300001
  },
  
  // 기본 개인정보
  name: {
    type: String,
    required: [true, '환자 이름은 필수입니다.'],
    trim: true
  },
  
  phone: {
    type: String,
    default: '',
    trim: true
  },
  
  gender: {
    type: String,
    enum: ['male', 'female', ''],
    required: true,
    default: ''
  },
  
  residentNumber: {
    type: String,
    default: '',
    trim: true
  },
  
  birthDate: {
    type: Date,
    default: null
  },
  
  // 방문 정보
  visitType: {
    type: String,
    enum: ['초진', '재진'],
    default: '초진'
  },
  
  firstVisitDate: {
    type: Date,
    default: Date.now
  },
  
  lastVisitDate: {
    type: Date,
    default: Date.now
  },
  
  visitCount: {
    type: Number,
    default: 1
  },
  
  // 신체 정보
  height: {
    type: Number, // cm 단위
    default: null
  },
  
  weight: {
    type: Number, // kg 단위
    default: null
  },
  
  bmi: {
    type: Number,
    default: null
  },
  
  // 생활 정보
  personality: {
    type: String,
    default: ''
  },
  
  workIntensity: {
    type: String,
    enum: ['낮음', '보통', '높음', ''],
    default: ''
  },
  
  occupation: {
    type: String,
    default: ''
  },
  
  // 연락처 정보
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },
  
  address: {
    type: String,
    default: ''
  }
}, { _id: false });

// 증상 정보 스키마
const symptomsSchema = new mongoose.Schema({
  // 주요 증상
  mainSymptoms: [{
    symptom: String,
    severity: {
      type: String,
      enum: ['경미', '보통', '심함'],
      default: '보통'
    },
    duration: String, // 증상 지속 기간
    notes: String
  }],
  
  // 전신 증상
  systemicSymptoms: [String],
  
  // 소화기 증상
  digestiveSymptoms: [String],
  
  // 호흡기 증상
  respiratorySymptoms: [String],
  
  // 심혈관 증상
  cardiovascularSymptoms: [String],
  
  // 근골격계 증상
  musculoskeletalSymptoms: [String],
  
  // 신경계 증상
  neurologicalSymptoms: [String],
  
  // 피부 증상
  dermatologicalSymptoms: [String],
  
  // 기타 증상
  otherSymptoms: [String],
  
  // 증상 메모
  symptomMemo: {
    type: String,
    default: ''
  }
}, { _id: false });

// 복용 약물 정보 스키마
const medicationSchema = new mongoose.Schema({
  // 현재 복용 중인 약물
  currentMedications: [{
    name: String,
    dosage: String,
    frequency: String,
    startDate: Date,
    endDate: Date,
    purpose: String,
    sideEffects: [String],
    notes: String
  }],
  
  // 과거 복용 약물
  medicationHistory: [{
    name: String,
    dosage: String,
    frequency: String,
    startDate: Date,
    endDate: Date,
    reason: String,
    effectiveness: {
      type: String,
      enum: ['효과적', '보통', '효과없음', '부작용'],
      default: '보통'
    },
    notes: String
  }],
  
  // 약물 알레르기
  allergies: [String],
  
  // 약물 선호도
  preferences: [String],
  
  // 약물 메모
  medicationMemo: {
    type: String,
    default: ''
  }
}, { _id: false });

// 생활습관 정보 스키마
const lifestyleSchema = new mongoose.Schema({
  // 식습관
  diet: {
    type: {
      type: String,
      enum: ['일반식', '채식', '저염식', '저지방식', '기타'],
      default: '일반식'
    },
    preferences: [String],
    restrictions: [String],
    notes: String
  },
  
  // 운동
  exercise: {
    frequency: {
      type: String,
      enum: ['없음', '주1-2회', '주3-4회', '주5회이상'],
      default: '없음'
    },
    type: [String],
    duration: String,
    intensity: {
      type: String,
      enum: ['낮음', '보통', '높음'],
      default: '보통'
    },
    notes: String
  },
  
  // 수면
  sleep: {
    averageHours: Number,
    quality: {
      type: String,
      enum: ['좋음', '보통', '나쁨'],
      default: '보통'
    },
    problems: [String],
    notes: String
  },
  
  // 흡연
  smoking: {
    status: {
      type: String,
      enum: ['비흡연', '현재흡연', '과거흡연'],
      default: '비흡연'
    },
    years: Number,
    amount: String, // 하루 흡연량
    quitDate: Date,
    notes: String
  },
  
  // 음주
  alcohol: {
    status: {
      type: String,
      enum: ['비음주', '가끔', '정기적'],
      default: '비음주'
    },
    frequency: String,
    amount: String,
    notes: String
  },
  
  // 스트레스
  stress: {
    level: {
      type: String,
      enum: ['낮음', '보통', '높음'],
      default: '보통'
    },
    sources: [String],
    copingMethods: [String],
    notes: String
  }
}, { _id: false });

// 가족력 정보 스키마
const familyHistorySchema = new mongoose.Schema({
  // 가족 구성
  familyMembers: [{
    relationship: String,
    age: Number,
    healthStatus: String,
    diseases: [String],
    notes: String
  }],
  
  // 유전성 질환
  hereditaryDiseases: [{
    disease: String,
    affectedMembers: [String],
    notes: String
  }],
  
  // 가족력 메모
  familyHistoryMemo: {
    type: String,
    default: ''
  }
}, { _id: false });

// 과거력 정보 스키마
const medicalHistorySchema = new mongoose.Schema({
  // 과거 질환
  pastDiseases: [{
    disease: String,
    diagnosisDate: Date,
    treatment: String,
    outcome: {
      type: String,
      enum: ['완치', '개선', '유지', '악화'],
      default: '완치'
    },
    notes: String
  }],
  
  // 수술력
  surgeries: [{
    procedure: String,
    date: Date,
    hospital: String,
    outcome: String,
    notes: String
  }],
  
  // 입원력
  hospitalizations: [{
    reason: String,
    hospital: String,
    admissionDate: Date,
    dischargeDate: Date,
    outcome: String,
    notes: String
  }],
  
  // 외상력
  injuries: [{
    type: String,
    date: Date,
    severity: {
      type: String,
      enum: ['경미', '보통', '심함'],
      default: '보통'
    },
    treatment: String,
    outcome: String,
    notes: String
  }],
  
  // 과거력 메모
  medicalHistoryMemo: {
    type: String,
    default: ''
  }
}, { _id: false });

// 진료 기록 스키마
const medicalRecordSchema = new mongoose.Schema({
  recordId: {
    type: String,
    required: true
  },
  
  visitDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // 주관적 증상
  subjectiveSymptoms: [String],
  
  // 객관적 소견
  objectiveFindings: [String],
  
  // 맥상 분석
  pulseAnalysis: {
    detectedPulse: String,
    matchingScore: Number,
    pulseProfile: {
      pulseCode: String,
      pvcType: String,
      bvType: String,
      svType: String,
      hrType: String,
      description: String,
      recommendations: [String]
    }
  },
  
  // 맥파 데이터
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
    PVC: Number,
    BV: Number,
    SV: Number
  },
  
  // 맥상 진단
  macSang: {
    floating: Boolean,
    sunken: Boolean,
    slow: Boolean,
    rapid: Boolean,
    slippery: Boolean,
    rough: Boolean,
    string: Boolean,
    scattered: Boolean,
    notes: String
  },
  
  // 진단
  diagnosis: {
    primary: String,
    secondary: [String],
    differential: [String]
  },
  
  // 치료
  treatment: {
    plan: String,
    medications: [{
      name: String,
      dosage: String,
      frequency: String,
      duration: String,
      instructions: String
    }],
    procedures: [String],
    recommendations: [String]
  },
  
  // 예후
  prognosis: {
    type: String,
    enum: ['좋음', '보통', '나쁨'],
    default: '보통'
  },
  
  // 메모
  memo: String,
  
  // 상태
  status: {
    type: String,
    enum: ['draft', 'completed', 'cancelled'],
    default: 'draft'
  }
}, { _id: false });

// 메인 환자 데이터 스키마
const patientDataSchema = new mongoose.Schema({
  // 기본 정보
  basicInfo: {
    type: basicInfoSchema,
    required: true
  },
  
  // 증상 정보
  symptoms: {
    type: symptomsSchema,
    default: {}
  },
  
  // 복용 약물 정보
  medication: {
    type: medicationSchema,
    default: {}
  },
  
  // 생활습관 정보
  lifestyle: {
    type: lifestyleSchema,
    default: {}
  },
  
  // 가족력 정보
  familyHistory: {
    type: familyHistorySchema,
    default: {}
  },
  
  // 과거력 정보
  medicalHistory: {
    type: medicalHistorySchema,
    default: {}
  },
  
  // 진료 기록
  medicalRecords: [medicalRecordSchema],
  
  // 전체 메모
  generalMemo: {
    type: String,
    default: ''
  },
  
  // 상태 관리
  status: {
    type: String,
    enum: ['active', 'inactive', 'deceased'],
    default: 'active'
  },
  
  // 활동 로그
  activityLog: [{
    action: String,
    description: String,
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  
  // 메타데이터
  metadata: {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    dataQuality: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor'],
      default: 'good'
    },
    lastDataUpdate: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true
});

// 가상 필드: 나이 계산
patientDataSchema.virtual('age').get(function() {
  if (!this.basicInfo.birthDate) return null;
  
  const birthDate = new Date(this.basicInfo.birthDate);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

// 가상 필드: BMI 계산
patientDataSchema.virtual('calculatedBmi').get(function() {
  if (!this.basicInfo.height || !this.basicInfo.weight) return null;
  const heightInMeters = this.basicInfo.height / 100;
  return (this.basicInfo.weight / (heightInMeters * heightInMeters)).toFixed(1);
});

// 인덱스 설정
patientDataSchema.index({ 'basicInfo.patientId': 1 }, { unique: true });
patientDataSchema.index({ 'basicInfo.name': 1 });
patientDataSchema.index({ 'basicInfo.phone': 1 });
patientDataSchema.index({ 'basicInfo.residentNumber': 1 });
patientDataSchema.index({ 'basicInfo.visitType': 1 });
patientDataSchema.index({ status: 1 });
patientDataSchema.index({ createdAt: -1 });
patientDataSchema.index({ 'basicInfo.lastVisitDate': -1 });

// JSON 변환 시 가상 필드 포함
patientDataSchema.set('toJSON', { virtuals: true });
patientDataSchema.set('toObject', { virtuals: true });

// 활동 로그 추가 메서드
patientDataSchema.methods.addActivityLog = function(action, description, userId) {
  this.activityLog.push({
    action,
    description,
    userId: userId || this.metadata.createdBy,
    timestamp: new Date()
  });
};

// 고유 환자 ID 생성 메서드
patientDataSchema.statics.generateUniqueId = async function() {
  const counter = await mongoose.model('Counter').findOneAndUpdate(
    { name: 'patientData' },
    { $inc: { sequence: 1 } },
    { upsert: true, new: true }
  );
  
  const date = new Date();
  const ymd = date.toISOString().slice(0, 10).replace(/-/g, '');
  return `P${ymd}${counter.sequence.toString().padStart(4, '0')}`;
};

// 데이터 검증 미들웨어
patientDataSchema.pre('save', function(next) {
  // BMI 자동 계산
  if (this.basicInfo.height && this.basicInfo.weight && !this.basicInfo.bmi) {
    const heightInMeters = this.basicInfo.height / 100;
    this.basicInfo.bmi = (this.basicInfo.weight / (heightInMeters * heightInMeters)).toFixed(1);
  }
  
  // 마지막 업데이트 정보 갱신
  this.metadata.lastDataUpdate = new Date();
  
  next();
});

const PatientData = mongoose.model('PatientData', patientDataSchema);

module.exports = PatientData; 