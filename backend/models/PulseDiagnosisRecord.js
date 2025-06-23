const mongoose = require('mongoose');

const pulseDiagnosisRecordSchema = new mongoose.Schema({
  // 기본 정보
  recordId: {
    type: String,
    unique: true,
    required: true
    // PD + YYYYMMDD + 4자리 순번
    // 예: PD202504300001
  },
  
  // 환자 정보
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  
  // 의사 정보
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // 진단 일시
  diagnosisDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  
  // 맥상 측정 데이터
  pulseData: {
    // 생리학적 매개변수
    pvc: {
      type: String,
      required: true,
      enum: ['침', '부']
    },
    hr: {
      type: String,
      required: true,
      enum: ['삭', '지', '평']
    },
    bv: {
      type: String,
      required: true,
      enum: ['활', '삽']
    },
    sv: {
      type: String,
      required: true,
      enum: ['실', '허']
    },
    
    // 측정된 맥상명
    detectedPulse: {
      type: String,
      required: true
    },
    
    // 매칭 점수
    matchingScore: {
      type: Number,
      required: true
    },
    
    // 매칭된 맥상 프로파일
    matchedPulseProfile: {
      pulseCode: String,
      pvcType: String,
      bvType: String,
      svType: String,
      hrType: String,
      description: String,
      recommendations: [String]
    }
  },
  
  // 진단 결과
  diagnosis: {
    // 최종 진단된 맥상
    finalPulse: {
      type: String,
      required: true
    },
    
    // 진단 메모
    memo: {
      type: String,
      default: ''
    },
    
    // 추가 관찰사항
    observations: [String],
    
    // 치료 권고사항
    recommendations: [String],
    
    // 위험도 평가
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low'
    }
  },
  
  // 측정 환경 정보
  measurementContext: {
    // 측정 시간대
    timeOfDay: {
      type: String,
      enum: ['morning', 'afternoon', 'evening', 'night']
    },
    
    // 측정 전 활동
    preActivity: String,
    
    // 측정 환경 온도
    temperature: Number,
    
    // 측정 환경 습도
    humidity: Number,
    
    // 측정자 메모
    notes: String
  },
  
  // 상태 관리
  status: {
    type: String,
    enum: ['draft', 'confirmed', 'reviewed', 'archived'],
    default: 'draft'
  },
  
  // 검토 정보
  review: {
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    reviewNotes: String
  },
  
  // 첨부 파일
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileType: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // 메타데이터
  metadata: {
    deviceInfo: String,
    softwareVersion: String,
    measurementDuration: Number, // 측정 소요 시간 (초)
    dataQuality: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor'],
      default: 'good'
    }
  },
  
  // 활성 상태
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// 인덱스 설정
pulseDiagnosisRecordSchema.index({ patientId: 1, diagnosisDate: -1 });
pulseDiagnosisRecordSchema.index({ doctorId: 1, diagnosisDate: -1 });
pulseDiagnosisRecordSchema.index({ 'pulseData.detectedPulse': 1 });
pulseDiagnosisRecordSchema.index({ status: 1 });
pulseDiagnosisRecordSchema.index({ recordId: 1 });

// 가상 필드: 진단 날짜 (YYYY-MM-DD)
pulseDiagnosisRecordSchema.virtual('diagnosisDateFormatted').get(function() {
  return this.diagnosisDate.toISOString().split('T')[0];
});

// JSON 변환 시 가상 필드 포함
pulseDiagnosisRecordSchema.set('toJSON', { virtuals: true });
pulseDiagnosisRecordSchema.set('toObject', { virtuals: true });

const PulseDiagnosisRecord = mongoose.model('PulseDiagnosisRecord', pulseDiagnosisRecordSchema);

module.exports = PulseDiagnosisRecord; 