export const PATIENT_STATUS = {
  WAITING: 'WAITING',     // 대기중
  CALLED: 'CALLED',      // 호출됨
  IN_TREATMENT: 'IN_TREATMENT',  // 진료중
  COMPLETED: 'COMPLETED' // 진료완료
};

export const STATUS_DISPLAY = {
  [PATIENT_STATUS.WAITING]: '대기중',
  [PATIENT_STATUS.CALLED]: '호출됨',
  [PATIENT_STATUS.IN_TREATMENT]: '진료중',
  [PATIENT_STATUS.COMPLETED]: '진료완료'
}; 