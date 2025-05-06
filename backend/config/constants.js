const constants = {
  // 맥상 관련 상수
  PULSE_WAVE: {
    MIN_PVC: 0,
    MAX_PVC: 100,
    MIN_HR: 40,
    MAX_HR: 200,
    MIN_BV: 0,
    MAX_BV: 100,
    MIN_SV: 0,
    MAX_SV: 100
  },

  // 사용자 역할
  USER_ROLES: {
    ADMIN: 'admin',
    DOCTOR: 'doctor',
    RECEPTIONIST: 'receptionist'
  },

  // 환자 상태
  PATIENT_STATUS: {
    WAITING: 'waiting',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
  },

  // 에러 코드
  ERROR_CODES: {
    INVALID_INPUT: 'INVALID_INPUT',
    UNAUTHORIZED: 'UNAUTHORIZED',
    NOT_FOUND: 'NOT_FOUND',
    SERVER_ERROR: 'SERVER_ERROR'
  },

  GENDER: {
    MALE: 'male',
    FEMALE: 'female'
  },

  BLOOD_TYPES: {
    A_POSITIVE: 'A+',
    A_NEGATIVE: 'A-',
    B_POSITIVE: 'B+',
    B_NEGATIVE: 'B-',
    O_POSITIVE: 'O+',
    O_NEGATIVE: 'O-',
    AB_POSITIVE: 'AB+',
    AB_NEGATIVE: 'AB-'
  },

  RECORD_STATUS: {
    DRAFT: 'draft',        // 작성 중
    COMPLETED: 'completed',// 작성 완료
    CANCELED: 'canceled'   // 취소됨
  },

  APPOINTMENT_STATUS: {
    SCHEDULED: 'scheduled',    // 예약됨
    COMPLETED: 'completed',    // 완료됨
    CANCELLED: 'cancelled',      // 취소됨
    NO_SHOW: 'no_show'        // 노쇼
  },

  APPOINTMENT_TYPE: {
    NEW: 'new',           // 초진
    FOLLOW_UP: 'follow_up'// 재진
  },

  CANCELLATION_REASONS: {
    PATIENT_REQUEST: 'patient_request',     // 환자 요청
    DOCTOR_SCHEDULE: 'doctor_schedule',     // 의사 일정 변경
    HOSPITAL_SCHEDULE: 'hospital_schedule', // 병원 일정 변경
    EMERGENCY: 'emergency',                 // 응급 상황
    OTHER: 'other'                         // 기타
  }
};

module.exports = constants;
