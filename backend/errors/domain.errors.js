const { AppError } = require('../middlewares/errorHandler');

class PatientNotFoundError extends AppError {
  constructor(patientId) {
    super(`환자 ID ${patientId}를 찾을 수 없습니다.`, 404, 'PATIENT_NOT_FOUND');
  }
}

class AppointmentNotFoundError extends AppError {
  constructor(appointmentId) {
    super(`예약 ID ${appointmentId}를 찾을 수 없습니다.`, 404, 'APPOINTMENT_NOT_FOUND');
  }
}

class DuplicateAppointmentError extends AppError {
  constructor(patientId, date) {
    super(
      `환자 ID ${patientId}는 이미 ${date}에 예약이 있습니다.`,
      409,
      'DUPLICATE_APPOINTMENT'
    );
  }
}

class InvalidTimeSlotError extends AppError {
  constructor(time) {
    super(`유효하지 않은 시간대입니다: ${time}`, 400, 'INVALID_TIME_SLOT');
  }
}

class TimeSlotUnavailableError extends AppError {
  constructor(time) {
    super(`해당 시간대는 이미 예약되어 있습니다: ${time}`, 409, 'TIME_SLOT_UNAVAILABLE');
  }
}

class InvalidMedicalRecordError extends AppError {
  constructor(message) {
    super(`유효하지 않은 의료 기록: ${message}`, 400, 'INVALID_MEDICAL_RECORD');
  }
}

class UnauthorizedAccessError extends AppError {
  constructor() {
    super('이 작업을 수행할 권한이 없습니다.', 403, 'UNAUTHORIZED_ACCESS');
  }
}

class InvalidCredentialsError extends AppError {
  constructor() {
    super('잘못된 로그인 정보입니다.', 401, 'INVALID_CREDENTIALS');
  }
}

class BackupError extends AppError {
  constructor(message) {
    super(`백업 작업 중 오류 발생: ${message}`, 500, 'BACKUP_ERROR');
  }
}

class RestoreError extends AppError {
  constructor(message) {
    super(`복원 작업 중 오류 발생: ${message}`, 500, 'RESTORE_ERROR');
  }
}

class DataValidationError extends AppError {
  constructor(errors) {
    super(
      '데이터 유효성 검증 실패',
      400,
      'DATA_VALIDATION_ERROR',
      { validationErrors: errors }
    );
  }
}

class DomainError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends DomainError {
  constructor(message = '입력값이 유효하지 않습니다.') {
    super(message);
    this.statusCode = 400;
  }
}

class ResourceNotFoundError extends DomainError {
  constructor(message = '요청한 리소스를 찾을 수 없습니다.') {
    super(message);
    this.statusCode = 404;
  }
}

module.exports = {
  PatientNotFoundError,
  AppointmentNotFoundError,
  DuplicateAppointmentError,
  InvalidTimeSlotError,
  TimeSlotUnavailableError,
  InvalidMedicalRecordError,
  UnauthorizedAccessError,
  InvalidCredentialsError,
  BackupError,
  RestoreError,
  DataValidationError,
  DomainError,
  ValidationError,
  ResourceNotFoundError
}; 