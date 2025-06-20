const mongoose = require('mongoose');
const moment = require('moment-timezone');

const counterSchema = new mongoose.Schema({
  _id: String,  // 'queueSequence_YYYYMMDD' 형식
  seq: {
    type: Number,
    default: 0
  },
  date: {
    type: Date,
    required: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  lockExpireAt: {
    type: Date
  }
});

// 카운터 증가 (원자적 연산)
counterSchema.statics.getNextSequence = async function(dateStr) {
  const startTime = Date.now();
  console.log('🔄 순번 생성 시작:', { dateStr });

  try {
    // 1. 락 해제: 30초 이상 된 락은 해제
    await this.updateMany(
      {
        isLocked: true,
        lockExpireAt: { $lt: new Date() }
      },
      {
        $set: { isLocked: false },
        $unset: { lockExpireAt: 1 }
      }
    );

    // 2. 락 획득 시도
    const lockExpireAt = new Date(Date.now() + 30000); // 30초 후 만료
    const result = await this.findOneAndUpdate(
      { 
        _id: `queueSequence_${dateStr}`,
        $or: [
          { isLocked: false },
          { lockExpireAt: { $lt: new Date() } }
        ]
      },
      { 
        $set: { 
          isLocked: true,
          lockExpireAt
        }
      },
      { 
        upsert: true,
        new: true,
        maxTimeMS: 5000  // 5초 타임아웃
      }
    );

    if (!result) {
      console.error('❌ 락 획득 실패');
      throw new Error('순번 생성을 위한 락 획득 실패');
    }

    // 3. 순번 증가
    const updated = await this.findOneAndUpdate(
      { 
        _id: `queueSequence_${dateStr}`,
        isLocked: true,
        lockExpireAt
      },
      { 
        $inc: { seq: 1 },
        $set: { 
          date: moment(dateStr, 'YYYYMMDD').toDate(),
          lastUpdated: new Date(),
          isLocked: false
        },
        $unset: { lockExpireAt: 1 }
      },
      { 
        new: true,
        maxTimeMS: 5000
      }
    );

    if (!updated) {
      throw new Error('순번 증가 실패: 락이 해제됨');
    }

    const processingTime = Date.now() - startTime;
    console.log('✅ 순번 생성 완료:', {
      sequence: updated.seq,
      processingTime: `${processingTime}ms`
    });

    return updated.seq;

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('❌ 순번 생성 오류:', {
      error: error.message,
      processingTime: `${processingTime}ms`
    });

    // 락 해제 시도
    try {
      await this.updateOne(
        { _id: `queueSequence_${dateStr}` },
        { 
          $set: { isLocked: false },
          $unset: { lockExpireAt: 1 }
        }
      );
    } catch (unlockError) {
      console.error('락 해제 실패:', unlockError);
    }

    throw error;
  }
};

// 특정 날짜의 마지막 순번 조회
counterSchema.statics.getCurrentSequence = async function(dateStr) {
  const counter = await this.findOne(
    { _id: `queueSequence_${dateStr}` },
    { seq: 1 },
    { maxTimeMS: 5000 }
  ).lean();
  
  return counter ? counter.seq : 0;
};

// 락이 걸린 카운터 정리
counterSchema.statics.cleanupLocks = async function() {
  const result = await this.updateMany(
    {
      isLocked: true,
      lockExpireAt: { $lt: new Date() }
    },
    {
      $set: { isLocked: false },
      $unset: { lockExpireAt: 1 }
    }
  );

  return result.modifiedCount;
};

const Counter = mongoose.model('Counter', counterSchema);

module.exports = Counter; 