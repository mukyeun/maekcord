// utils/generateQueueNumber.js
import dayjs from 'dayjs';

/**
 * 대기번호 및 순번 생성 함수
 * @param {Array} queueList - 전체 대기 목록 (date가 YYYY-MM-DD 형식)
 * @returns {Object} { queueNumber, sequenceNumber, date }
 */
export function generateQueueNumber(queueList = []) {
  const today = dayjs().format('YYYY-MM-DD');
  const todayQueues = queueList.filter(q => q.date === today);

  const maxNumber = todayQueues.reduce((max, q) => {
    const num = parseInt(q.queueNumber?.split('-')[1], 10);
    return isNaN(num) ? max : Math.max(max, num);
  }, 0);

  const nextNumber = (maxNumber + 1).toString().padStart(3, '0');
  const queueNumber = `Q${dayjs().format('YYYYMMDD')}-${nextNumber}`;

  return {
    queueNumber,
    sequenceNumber: maxNumber + 1,
    date: today,
  };
}

export default generateQueueNumber;
