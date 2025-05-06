const mongoose = require('mongoose');
const { RECORD_STATUS } = require('../config/constants');

const medicalRecordSchema = new mongoose.Schema({
  recordId: {
    type: String,
    unique: true
    // MR + YYYYMMDD + 4자리 순번
    // 예: MR202504300001
  },
  patientId: {
    type: String,
    required: [true, '환자 ID는 필수입니다'],
    ref: 'Patient'
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, '의사 ID는 필수입니다'],
    ref: 'User'
  },
  visitDate: {
    type: Date,
    required: [true, '진료일은 필수입니다'],
    default: Date.now
  },
  symptoms: {
    type: String,
    required: [true, '증상은 필수입니다']
  },
  diagnosis: {
    type: String,
    required: [true, '진단은 필수입니다']
  },
  treatment: {
    type: String,
    required: [true, '치료 내용은 필수입니다']
  },
  prescription: [{
    medicine: {
      type: String,
      required: true
    },
    dosage: {
      type: String,
      required: true
    },
    instructions: String,
    duration: String
  }],
  notes: String,
  status: {
    type: String,
    enum: Object.values(RECORD_STATUS),
    default: RECORD_STATUS.DRAFT
  },
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileType: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// recordId 자동 생성
medicalRecordSchema.pre('save', async function(next) {
  if (this.isNew) {
    const today = new Date();
    const dateStr = today.toISOString().slice(0,10).replace(/-/g,'');
    
    // 오늘 생성된 마지막 진료 기록 ID 조회
    const lastRecord = await this.constructor.findOne({
      recordId: new RegExp(`MR${dateStr}.*`)
    }).sort({ recordId: -1 });

    let sequence = '0001';
    if (lastRecord) {
      const lastSequence = parseInt(lastRecord.recordId.slice(-4));
      sequence = String(lastSequence + 1).padStart(4, '0');
    }

    this.recordId = `MR${dateStr}${sequence}`;
  }
  next();
});

const MedicalRecord = mongoose.model('MedicalRecord', medicalRecordSchema);

module.exports = MedicalRecord; 