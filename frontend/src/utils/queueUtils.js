import dayjs from 'dayjs';

/**
 * 대기번호 생성 함수
 * 형식: Q + YYYYMMDD + "-" + 3자리 랜덤숫자
 * 예시: Q20240327-123
 */
export const generateQueueNumber = () => {
  const date = dayjs().format('YYYYMMDD');
  const random = String(Math.floor(100 + Math.random() * 900));  // 100-999 사이 랜덤 숫자
  return `Q${date}-${random}`;
}; 