const appointmentConfig = {
  // 취소 가능 시간 (예약 시작 24시간 전까지)
  CANCELLATION_DEADLINE: 24 * 60 * 60 * 1000,
  
  // 취소 패널티 기준 (시간)
  PENALTY_THRESHOLDS: {
    NONE: 72,      // 72시간 이전 취소: 패널티 없음
    LIGHT: 48,     // 48-72시간 전 취소: 경고
    MEDIUM: 24,    // 24-48시간 전 취소: 일시적 예약 제한
    HEAVY: 0       // 24시간 이내 취소 또는 노쇼: 심각한 제한
  },
  
  // 취소 사유 코드
  CANCELLATION_REASONS: {
    PATIENT_REQUEST: 'patient_request',    // 환자 요청
    DOCTOR_UNAVAILABLE: 'doctor_unavailable', // 의사 사정
    EMERGENCY: 'emergency',                // 응급 상황
    RESCHEDULED: 'rescheduled',           // 일정 변경
    NO_SHOW: 'no_show',                   // 노쇼
    OTHER: 'other'                        // 기타
  }
};

module.exports = appointmentConfig; 