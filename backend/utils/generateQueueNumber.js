const Queue = require('../models/Queue');
const moment = require('moment-timezone');
const logger = require('./logger');

const generateAndSaveQueue = async (patientId) => {
  try {
    // 날짜 설정 (서울 시간대)
    const today = moment().tz('Asia/Seoul').startOf('day').toDate();
    const tomorrow = moment(today).add(1, 'day').toDate();

    logger.info('대기번호 생성 시작:', { 
      patientId,
      date: today.toISOString() 
    });

    // 최대 999번 시도
    for (let i = 1; i <= 999; i++) {
      const dateStr = moment(today).format('YYYYMMDD');
      const queueNumber = `Q${dateStr}-${i.toString().padStart(3, '0')}`;

      try {
        // Queue 객체 생성 및 저장 시도
        const queue = new Queue({
          patientId,
          queueNumber,
          date: today,
          sequenceNumber: i,
          status: 'waiting'
        });

        // 저장 시도
        const savedQueue = await queue.save();
        await savedQueue.populate('patientId');

        logger.info('대기번호 생성 및 저장 성공:', {
          queueNumber,
          date: today,
          sequenceNumber: i,
          patientId
        });

        return savedQueue;

      } catch (error) {
        // 중복 키 에러인 경우 다음 번호 시도
        if (error.code === 11000) {
          logger.warn('대기번호 중복, 다음 번호 시도:', {
            attempt: i,
            queueNumber,
            error: error.message
          });
          continue;
        }
        
        // 다른 에러는 바로 throw
        logger.error('대기번호 저장 중 오류:', error);
        throw error;
      }
    }

    // 모든 번호가 사용중인 경우
    logger.error('대기번호 생성 실패: 금일 번호 소진');
    throw new Error('오늘 사용 가능한 대기번호가 없습니다.');

  } catch (error) {
    logger.error('대기번호 생성 중 치명적 오류:', error);
    throw error;
  }
};

module.exports = generateAndSaveQueue; 