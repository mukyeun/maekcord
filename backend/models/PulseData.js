const mongoose = require('mongoose');

const pulseDataSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  // 맥파 원시 데이터
  rawData: {
    type: [Number],
    required: true,
    validate: [
      array => array.length > 0,
      '맥파 데이터는 비어있을 수 없습니다.'
    ]
  },
  // 샘플링 속도 (Hz)
  samplingRate: {
    type: Number,
    required: true,
    min: 1
  },
  // 측정 기기 정보
  deviceInfo: {
    type: {
      deviceId: String,
      deviceType: String,
      firmwareVersion: String
    },
    required: true
  },
  // 측정 위치 (예: 손가락, 손목 등)
  measurementSite: {
    type: String,
    required: true,
    enum: ['finger', 'wrist', 'ear']
  },
  // 측정 품질 점수 (0-100)
  qualityScore: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  // 분석된 특성들
  analysis: {
    heartRate: Number,          // 심박수
    systolicPeak: Number,       // 수축기 피크
    diastolicPeak: Number,      // 이완기 피크
    pulseTransitTime: Number,   // 맥파 전달 시간
    augmentationIndex: Number,  // 맥파 증강 지수
    notes: String              // 추가 분석 노트
  },
  // 측정자 정보
  measuredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // 환경 조건
  environmentalFactors: {
    temperature: Number,    // 온도 (°C)
    humidity: Number,      // 습도 (%)
    position: {           // 측정 자세
      type: String,
      enum: ['sitting', 'lying', 'standing']
    }
  },
  // 메타데이터
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// 인덱스 생성
pulseDataSchema.index({ patientId: 1, timestamp: -1 });
pulseDataSchema.index({ 'analysis.heartRate': 1 });
pulseDataSchema.index({ qualityScore: 1 });

// 가상 필드: 측정 시간 길이 (초)
pulseDataSchema.virtual('duration').get(function() {
  return this.rawData.length / this.samplingRate;
});

// 데이터 유효성 검사
pulseDataSchema.pre('save', function(next) {
  // 심박수 범위 검사 (30-250 bpm)
  if (this.analysis?.heartRate) {
    if (this.analysis.heartRate < 30 || this.analysis.heartRate > 250) {
      const err = new Error('심박수가 유효 범위를 벗어났습니다.');
      return next(err);
    }
  }
  
  // 데이터 길이 검사 (최소 5초)
  const minDuration = 5; // 초
  const minSamples = minDuration * this.samplingRate;
  if (this.rawData.length < minSamples) {
    const err = new Error(`맥파 데이터는 최소 ${minDuration}초 이상이어야 합니다.`);
    return next(err);
  }

  next();
});

// 맥파 분석 메서드
pulseDataSchema.methods.analyzePulseWave = function() {
  // 여기에 맥파 분석 로직 구현
  // 1. 노이즈 필터링
  // 2. 피크 검출
  // 3. 특성 추출
  // 4. 품질 점수 계산
  // 추후 구현 예정
};

const PulseData = mongoose.model('PulseData', pulseDataSchema);

module.exports = PulseData; 