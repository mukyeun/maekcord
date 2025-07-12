const mongoose = require('mongoose');
const websocketService = require('../services/websocketService');

const vitalSignSchema = new mongoose.Schema({
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
  type: {
    type: String,
    enum: ['blood_pressure', 'heart_rate', 'temperature', 'oxygen_saturation', 'respiratory_rate'],
    required: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  unit: {
    type: String,
    required: true
  },
  measuredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: String,
  status: {
    type: String,
    enum: ['normal', 'warning', 'critical'],
    required: true
  },
  device: {
    type: String,
    required: true
  },
  metadata: {
    type: Map,
    of: String
  }
}, {
  timestamps: true
});

// 인덱스 생성
vitalSignSchema.index({ patientId: 1, timestamp: -1 });
vitalSignSchema.index({ type: 1, status: 1 });

// 가상 필드: 경과 시간
vitalSignSchema.virtual('elapsedTime').get(function() {
  return Date.now() - this.timestamp;
});

// 상태 자동 계산 메서드
vitalSignSchema.methods.calculateStatus = function() {
  const thresholds = {
    blood_pressure: {
      warning: { systolic: [140, 90], diastolic: [90, 60] },
      critical: { systolic: [180, 70], diastolic: [110, 40] }
    },
    heart_rate: {
      warning: [100, 50],
      critical: [120, 40]
    },
    temperature: {
      warning: [37.8, 35.5],
      critical: [39.0, 35.0]
    },
    oxygen_saturation: {
      warning: [95, 90],
      critical: [90, 85]
    },
    respiratory_rate: {
      warning: [24, 12],
      critical: [30, 8]
    }
  };

  const threshold = thresholds[this.type];
  if (!threshold) return 'normal';

  let value = this.value;
  if (this.type === 'blood_pressure') {
    const systolic = value.systolic;
    const diastolic = value.diastolic;
    
    if (systolic > threshold.critical.systolic[0] || systolic < threshold.critical.systolic[1] ||
        diastolic > threshold.critical.diastolic[0] || diastolic < threshold.critical.diastolic[1]) {
      return 'critical';
    }
    if (systolic > threshold.warning.systolic[0] || systolic < threshold.warning.systolic[1] ||
        diastolic > threshold.warning.diastolic[0] || diastolic < threshold.warning.diastolic[1]) {
      return 'warning';
    }
  } else {
    if (value > threshold.critical[0] || value < threshold.critical[1]) {
      return 'critical';
    }
    if (value > threshold.warning[0] || value < threshold.warning[1]) {
      return 'warning';
    }
  }

  return 'normal';
};

// 저장 전 상태 자동 계산
vitalSignSchema.pre('save', async function(next) {
  if (this.isModified('value')) {
    const previousStatus = this.status;
    this.status = this.calculateStatus();
    
    // 상태가 critical로 변경된 경우 실시간 알림 전송
    if (this.status === 'critical' && previousStatus !== 'critical') {
      try {
        await websocketService.sendCriticalAlert(this);
      } catch (error) {
        console.error('실시간 알림 전송 실패:', error);
      }
    }
  }
  next();
});

const VitalSign = mongoose.model('VitalSign', vitalSignSchema);

module.exports = VitalSign; 