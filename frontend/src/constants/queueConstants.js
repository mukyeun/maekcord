export const QUEUE_STATUS = {
  WAITING: 'waiting',
  CALLED: 'called',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no-show'
};

export const STATUS_DISPLAY = {
  [QUEUE_STATUS.WAITING]: '대기중',
  [QUEUE_STATUS.CALLED]: '호출됨',
  [QUEUE_STATUS.IN_PROGRESS]: '진료중',
  [QUEUE_STATUS.COMPLETED]: '완료',
  [QUEUE_STATUS.CANCELLED]: '취소',
  [QUEUE_STATUS.NO_SHOW]: '미응답'
};

export const isValidStatus = (status) => {
  if (!status) return false;
  const normalizedStatus = status.toString().trim().toLowerCase();
  return Object.values(QUEUE_STATUS).includes(normalizedStatus);
};

export const normalizeStatus = (status) => {
  if (!status) return null;
  return status.toString().trim().toLowerCase();
}; 