const mongoose = require('mongoose');
const moment = require('moment-timezone');
const Counter = require('./Counter');

const queueSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  sequenceNumber: {
    type: Number,
    required: true,
    set: function(val) {
      console.log('🔄 순번 변환 시도:', {
        original: val,
        type: typeof val
      });

      // null이나 undefined 체크
      if (val == null) {
        console.warn('⚠️ 순번이 null 또는 undefined:', val);
        return 0;
      }

      // 이미 숫자면 그대로 반환
      if (typeof val === 'number' && !isNaN(val)) {
        console.log('✅ 이미 숫자:', val);
        return val;
      }

      // 문자열이면 변환 시도
      if (typeof val === 'string') {
        // 앞의 0 제거 후 정수로 변환
        const cleaned = val.replace(/^0+/, '');
        const converted = parseInt(cleaned || '0', 10);
        
        console.log('✅ 문자열 변환 결과:', {
          original: val,
          cleaned,
          converted
        });
        
        return converted;
      }

      // 기타 타입은 강제 숫자 변환
      const forced = Number(val);
      console.warn('⚠️ 기타 타입 강제 변환:', {
        original: val,
        type: typeof val,
        converted: forced
      });
      
      return isNaN(forced) ? 0 : forced;
    },
    validate: {
      validator: function(val) {
        return Number.isInteger(val) && val >= 0;
      },
      message: '순번은 0 이상의 정수여야 합니다.'
    }
  },
  visitType: {
    type: String,
    enum: ['초진', '재진'],
    default: '초진'
  },
  symptoms: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['waiting', 'called', 'consulting', 'done', 'cancelled'],
    default: 'waiting'
  },
  registeredAt: {
    type: Date,
    default: () => moment().tz('Asia/Seoul').toDate()
  },
  date: {
    type: Date,
    required: true,
    set: function(val) {
      // 문자열이나 타임스탬프가 들어오면 Date 객체로 변환
      if (typeof val === 'string' || typeof val === 'number') {
        return moment(val).tz('Asia/Seoul').startOf('day').toDate();
      }
      // 이미 Date 객체면 시작 시간으로 설정
      if (val instanceof Date) {
        return moment(val).tz('Asia/Seoul').startOf('day').toDate();
      }
      return val;
    },
    get: function(val) {
      return val ? moment(val).tz('Asia/Seoul').startOf('day').toDate() : val;
    }
  },
  priority: {
    type: Number,
    default: 0
  },
  memo: {
    type: String,
    default: ''
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  isTest: {
    type: Boolean,
    default: false
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  // 향후 기능 확장을 위한 필드들 (현재는 미사용)
  estimatedTime: Date,      // 예상 진료 시간
  completedTime: Date,      // 진료 완료 시간
  archivedAt: Date,        // 보관 처리된 시간
  archivedReason: String,   // 보관 사유
  calledAt: {
    type: Date
  },
  consultingStartAt: {
    type: Date
  },
  consultingEndAt: {
    type: Date
  },
  cancelledAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 활성 대기열에 대한 복합 인덱스 (유니크 제거)
queueSchema.index(
  { patientId: 1, date: 1, status: 1 },
  { 
    name: 'active_queue_patient_date_status'
  }
);

// 날짜 + 순번 복합 인덱스
queueSchema.index(
  { date: 1, sequenceNumber: 1 },
  { unique: true, name: 'date_sequence_unique' }
);

// 상태 인덱스
queueSchema.index({ status: 1 });

// ✅ 가상 필드: 대기번호 (Q20240101-001 형식)
queueSchema.virtual('queueNumber').get(function() {
  const dateStr = moment(this.date).tz('Asia/Seoul').format('YYYYMMDD');
  return `Q${dateStr}-${String(this.sequenceNumber).padStart(3, '0')}`;
});

// ✅ 가상 필드: 대기 시간 (분)
queueSchema.virtual('waitingTime').get(function() {
  if (!this.registeredAt) return 0;
  return Math.floor((Date.now() - this.registeredAt.getTime()) / (1000 * 60));
});

// ✅ 인스턴스 메서드: 상태 변경
queueSchema.methods.updateStatus = async function(newStatus) {
  this.status = newStatus;
  if (newStatus === 'done') {
    this.completedTime = new Date();
  }
  await this.save();
  return this;
};

// ✅ 스태틱 메서드: 환자의 활성 대기열 확인
queueSchema.statics.findActiveQueue = async function(patientId, date) {
  const queue = await this.findOne({
    patientId,
    date,
    status: { $in: ['waiting', 'called', 'consulting'] },
    isArchived: false
  });

  if (!queue) return null;

  return {
    exists: true,
    queue,
    status: queue.status,
    queueNumber: queue.queueNumber,
    registeredAt: queue.registeredAt,
    waitingTime: queue.waitingTime,
    patientName: queue.patientId?.basicInfo?.name
  };
};

// ✅ 스태틱 메서드: 중복 등록 체크 (최적화)
queueSchema.statics.checkDuplicateQueue = async function(patientId, date) {
  const normalizedDate = moment(date).startOf('day').toDate();
  return this.findOne({
    patientId,
    date: normalizedDate,
    status: { $in: ['waiting', 'called', 'consulting'] },
    isArchived: false
  });
};

// ✅ 스태틱 메서드: 환자의 당일 대기열 상태 확인
queueSchema.statics.checkPatientQueueStatus = async function(patientId) {
  const today = moment().tz('Asia/Seoul').startOf('day').toDate();
  const queue = await this.findOne({
    patientId,
    date: today,
    isArchived: false
  });

  if (!queue) return null;

  return {
    exists: true,
    status: queue.status,
    queueNumber: queue.queueNumber,
    registeredAt: queue.registeredAt,
    waitingTime: queue.waitingTime
  };
};

// ✅ 날짜별 큐 조회 (활성 상태만)
queueSchema.statics.getQueuesByDate = async function(date) {
  return this.find({ 
    date,
    isArchived: false 
  })
  .sort({ sequenceNumber: 1 });
};

// ✅ 오늘 순번 생성 (Counter 사용으로 개선)
queueSchema.statics.generateTodaySequenceNumber = async function(date) {
  const startTime = Date.now();
  
  // date가 없거나 잘못된 값이면 오늘 날짜로 대체
  let momentDate;
  if (date) {
    momentDate = moment(date, 'YYYY-MM-DD').startOf('day');
  } else {
    momentDate = moment().tz('Asia/Seoul').startOf('day');
  }
  
  if (!momentDate.isValid()) {
    throw new Error('generateTodaySequenceNumber: 유효하지 않은 날짜입니다.');
  }
  
  const dateStr = momentDate.format('YYYYMMDD');
  
  try {
    // 1. MongoDB 연결 상태 확인
    if (mongoose.connection.readyState !== 1) {
      throw new Error('MongoDB 연결이 끊어졌습니다.');
    }

    // 2. 기존 테스트 문서 정리 (5분 이상 된 것)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    await this.deleteMany({
      isTest: true,
      createdAt: { $lt: fiveMinutesAgo }
    });

    // 3. Counter를 통한 순번 생성 시도
    console.time('🔄 Counter.getNextSequence');
    const nextSequence = await Counter.getNextSequence(dateStr);
    console.timeEnd('🔄 Counter.getNextSequence');

    const processingTime = Date.now() - startTime;
    console.log('✅ 순번 생성 완료:', {
      dateStr,
      nextSequence,
      processingTime: `${processingTime}ms`
    });

    return nextSequence;
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('❌ 순번 생성 오류:', {
      message: error.message,
      dateStr,
      processingTime: `${processingTime}ms`,
      mongoState: {
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host
      }
    });

    // 락 정리 시도
    try {
      await Counter.cleanupLocks();
    } catch (cleanupError) {
      console.error('락 정리 실패:', cleanupError);
    }

    throw new Error(`순번 생성 실패 (${processingTime}ms): ${error.message}`);
  }
};

// ✅ 오늘 순번 생성 (이전 이름 - 호환성 유지)
queueSchema.statics.generateTodayQueueNumber = async function() {
  return this.generateTodaySequenceNumber();
};

// ✅ 날짜별 마지막 순번 조회 (신규 추가)
queueSchema.statics.getLastSequenceNumber = async function(date) {
  const dateStr = moment(date).tz('Asia/Seoul').format('YYYYMMDD');
  return Counter.getCurrentSequence(dateStr);
};

// 상태 변경 시 자동으로 timestamp 업데이트
queueSchema.pre('save', function(next) {
  const now = new Date();
  
  switch(this.status) {
    case 'called':
      if (!this.calledAt) this.calledAt = now;
      break;
    case 'consulting':
      if (!this.consultingStartAt) this.consultingStartAt = now;
      break;
    case 'done':
      if (!this.consultingEndAt) this.consultingEndAt = now;
      break;
    case 'cancelled':
      if (!this.cancelledAt) this.cancelledAt = now;
      break;
  }
  
  this.updatedAt = now;
  next();
});

const Queue = mongoose.model('Queue', queueSchema);

module.exports = Queue;
