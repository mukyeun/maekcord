const Queue = require('../models/Queue');
const moment = require('moment-timezone');

// 새로운 대기번호 생성 함수
const generateQueueNumber = async () => {
  try {
    const today = moment().startOf('day').toDate();
    const tomorrow = moment().endOf('day').toDate();

    // 오늘 날짜의 대기 목록 조회
    const todayQueues = await Queue.find({
      createdAt: {
        $gte: today,
        $lt: tomorrow
      }
    }).sort({ queueNumber: -1 });

    // 사용된 번호들의 집합 생성
    const usedNumbers = new Set(
      todayQueues.map(q => parseInt(q.queueNumber.slice(1)))
    );

    // Q001부터 순차적으로 검사하여 사용되지 않은 번호 찾기
    for (let i = 1; i <= 999; i++) {
      if (!usedNumbers.has(i)) {
        const queueNumber = `Q${i.toString().padStart(3, '0')}`;
        console.log('✅ 대기번호 생성됨:', {
          number: queueNumber,
          date: today.toISOString().split('T')[0]
        });
        return queueNumber;
      }
    }

    throw new Error('오늘 사용 가능한 대기번호가 없습니다 (1-999)');
  } catch (error) {
    console.error('❌ 대기번호 생성 실패:', error);
    throw error;
  }
};

module.exports = {
  generateQueueNumber
}; 