const mongoose = require('mongoose');

const measurementSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: [true, '환자 정보는 필수입니다.']
    },
    measuredAt: {
        type: Date,
        required: [true, '측정 시간은 필수입니다.'],
        default: Date.now
    },
    deviceId: {
        type: String,
        required: [true, '측정 장비 ID는 필수입니다.']
    },
    // 맥파 데이터
    pulseWave: {
        rawData: {
            type: [Number],
            required: [true, '원본 맥파 데이터는 필수입니다.']
        },
        samplingRate: {
            type: Number,
            required: [true, '샘플링 레이트는 필수입니다.']
        },
        duration: {
            type: Number,
            required: [true, '측정 시간은 필수입니다.']
        }
    },
    // 분석 결과
    analysis: {
        heartRate: {
            type: Number,
            required: true
        },
        systolicPressure: Number,
        diastolicPressure: Number,
        meanPressure: Number,
        pulseTransitTime: Number,
        augmentationIndex: Number,
        stiffnessIndex: Number
    },
    // 품질 지표
    quality: {
        signalQuality: {
            type: String,
            enum: ['excellent', 'good', 'fair', 'poor'],
            required: true
        },
        noiseLevel: {
            type: Number,
            min: 0,
            max: 100
        },
        artifactPercentage: {
            type: Number,
            min: 0,
            max: 100
        }
    },
    // 측정 환경
    environment: {
        temperature: Number,
        humidity: Number,
        position: {
            type: String,
            enum: ['sitting', 'lying', 'standing']
        }
    },
    // 메타데이터
    metadata: {
        softwareVersion: String,
        firmwareVersion: String,
        calibrationDate: Date,
        notes: String
    },
    // 상태
    status: {
        type: String,
        enum: ['pending', 'analyzed', 'verified', 'archived'],
        default: 'pending'
    },
    // 검증 정보
    verification: {
        verifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        verifiedAt: Date,
        comments: String
    }
}, {
    timestamps: true
});

// 인덱스 설정
measurementSchema.index({ patientId: 1, measuredAt: -1 });
measurementSchema.index({ deviceId: 1 });
measurementSchema.index({ status: 1 });
measurementSchema.index({ 'quality.signalQuality': 1 });

// 가상 필드: 측정 경과 시간
measurementSchema.virtual('elapsedTime').get(function() {
    return Date.now() - this.measuredAt;
});

// 통계 메서드
measurementSchema.statics.getStatsByPatient = async function(patientId) {
    return this.aggregate([
        { $match: { patientId: mongoose.Types.ObjectId(patientId) } },
        { $group: {
            _id: null,
            avgHeartRate: { $avg: '$analysis.heartRate' },
            avgSystolic: { $avg: '$analysis.systolicPressure' },
            avgDiastolic: { $avg: '$analysis.diastolicPressure' },
            totalMeasurements: { $sum: 1 },
            lastMeasurement: { $max: '$measuredAt' }
        }}
    ]);
};

// 데이터 내보내기 메서드
measurementSchema.methods.exportData = function() {
    return {
        id: this._id,
        patientId: this.patientId,
        measuredAt: this.measuredAt,
        deviceId: this.deviceId,
        analysis: this.analysis,
        quality: this.quality,
        status: this.status
    };
};

const Measurement = mongoose.model('Measurement', measurementSchema);

module.exports = Measurement; 