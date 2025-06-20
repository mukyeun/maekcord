const Queue = require('../models/Queue');
const moment = require('moment-timezone');
const logger = require('./logger');

/**
 * 환자 ID 기준으로 오늘 날짜 대기열 생성 (중복 회피)
 * @param {string} patientId
 * @param {object} [options] - 추가 필드: visitType, symptoms, memo 등
 * @returns {Promise<Object>} 저장된 Queue 문서
 */
async function generateAndSaveQueue(patientId, options = {}) {
  try {
    logger.info('🔄 [대기열 생성 시작]:', { patientId });

    const today = moment().tz('Asia/Seoul').startOf('day').toDate();

    logger.info('📆 오늘 날짜 기준 대기열 탐색:', { today });

    const todayQueues = await Queue.find({
      date: {
        $gte: today,
        $lt: moment(today).add(1, 'days').toDate()
      }
    }).sort({ sequenceNumber: -1 }).limit(1);

    const lastQueue = todayQueues[0];
    const lastSequence = lastQueue ? lastQueue.sequenceNumber : 0;

    logger.info('🔢 오늘 마지막 순번:', {
      lastSequence
    });

    for (let attempt = 1; attempt <= 999; attempt++) {
      const sequenceNumber = lastSequence + attempt;
      const queueNumber = `Q${moment(today).format('YYYYMMDD')}-${String(sequenceNumber).padStart(3, '0')}`;

      logger.info('🧪 대기번호 시도:', { sequenceNumber, queueNumber });

      try {
        const queueData = {
          patientId,
          date: today,
          queueNumber,
          sequenceNumber,
          status: 'waiting',
          visitType: options.visitType || '초진',
          symptoms: options.symptoms || [],
          memo: options.memo || ''
        };

        logger.info('📤 대기열 저장 시도:', queueData);

        const savedQueue = await Queue.create(queueData);
        const populatedQueue = await savedQueue.populate('patientId');

        logger.info('✅ 대기열 생성 성공:', {
          queueNumber,
          patientId,
          sequenceNumber
        });

        return populatedQueue;

      } catch (error) {
        if (error.code === 11000) {
          logger.warn('⚠️ 중복 대기번호, 다음 번호 재시도', { queueNumber });
          continue;
        }
        throw error;
      }
    }

    throw new Error('최대 시도 횟수(999) 초과 - 대기번호 생성 실패');

  } catch (error) {
    logger.error('❌ [대기열 생성 실패]:', {
      error: {
        message: error.message,
        code: error.code,
        stack: error.stack
      }
    });
    throw error;
  }
}

module.exports = generateAndSaveQueue;
