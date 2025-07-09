const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
    // 기본 정보
    patientId: {
        type: String,
        required: [true, '환자 ID는 필수입니다.'],
        unique: true,
        trim: true
    },
    name: {
        type: String,
        required: [true, '이름은 필수입니다.'],
        trim: true
    },
    birthDate: {
        type: Date,
        required: [true, '생년월일은 필수입니다.']
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        required: [true, '성별은 필수입니다.']
    },
    // 연락처 정보
    contact: {
        phone: {
            type: String,
            required: [true, '연락처는 필수입니다.'],
            validate: {
                validator: function(v) {
                    return /^\d{2,3}-\d{3,4}-\d{4}$/.test(v);
                },
                message: '올바른 전화번호 형식이 아닙니다.'
            }
        },
        email: {
            type: String,
            validate: {
                validator: function(v) {
                    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v);
                },
                message: '올바른 이메일 형식이 아닙니다.'
            }
        },
        address: {
            street: String,
            city: String,
            state: String,
            zipCode: String
        }
    },
    // 의료 정보
    medical: {
        bloodType: {
            type: String,
            enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
        },
        height: {
            type: Number,
            min: 0,
            max: 300
        },
        weight: {
            type: Number,
            min: 0,
            max: 500
        },
        allergies: [String],
        medications: [{
            name: String,
            dosage: String,
            frequency: String,
            startDate: Date,
            endDate: Date
        }],
        conditions: [{
            name: String,
            diagnosedDate: Date,
            status: {
                type: String,
                enum: ['active', 'managed', 'resolved']
            },
            notes: String
        }]
    },
    // 응급 연락처
    emergencyContact: {
        name: String,
        relationship: String,
        phone: String
    },
    // 방문 이력
    visits: [{
        date: Date,
        type: {
            type: String,
            enum: ['regular', 'emergency', 'followup']
        },
        doctor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        notes: String
    }],
    // 상태
    status: {
        type: String,
        enum: ['active', 'inactive', 'archived'],
        default: 'active'
    },
    // 메모
    notes: String
}, {
    timestamps: true
});

// 인덱스 설정
patientSchema.index({ patientId: 1 }, { unique: true });
patientSchema.index({ 'name': 1 });
patientSchema.index({ status: 1 });

// 가상 필드: 나이 계산
patientSchema.virtual('age').get(function() {
    return Math.floor((Date.now() - this.birthDate) / (365.25 * 24 * 60 * 60 * 1000));
});

// BMI 계산
patientSchema.virtual('bmi').get(function() {
    if (!this.medical.height || !this.medical.weight) return null;
    const heightInMeters = this.medical.height / 100;
    return (this.medical.weight / (heightInMeters * heightInMeters)).toFixed(1);
});

// 최근 방문 조회
patientSchema.methods.getLastVisit = function() {
    if (!this.visits || this.visits.length === 0) return null;
    return this.visits.sort((a, b) => b.date - a.date)[0];
};

// 활성 질환 조회
patientSchema.methods.getActiveConditions = function() {
    return this.medical.conditions.filter(c => c.status === 'active');
};

const Patient = mongoose.model('Patient', patientSchema);

module.exports = Patient; 