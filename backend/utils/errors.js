/**
 * 기본 에러 클래스
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 알림 에러
 */
class NotificationError extends AppError {
  constructor(message, originalError = null) {
    super(message, 500);
    this.name = 'NotificationError';
    this.originalError = originalError;
  }
}

/**
 * WebSocket 에러
 */
class WebSocketError extends AppError {
  constructor(message, code = 4000) {
    super(message, 500);
    this.name = 'WebSocketError';
    this.code = code;
  }
}

/**
 * 캐시 에러
 */
class CacheError extends AppError {
  constructor(message, originalError = null) {
    super(message, 500);
    this.name = 'CacheError';
    this.originalError = originalError;
  }
}

/**
 * 유효성 검사 에러
 */
class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

/**
 * 인증 에러
 */
class AuthenticationError extends AppError {
  constructor(message) {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

/**
 * 권한 에러
 */
class AuthorizationError extends AppError {
  constructor(message) {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

/**
 * 리소스를 찾을 수 없음
 */
class ResourceNotFoundError extends AppError {
  constructor(resource) {
    super(`${resource} not found`, 404);
    this.name = 'ResourceNotFoundError';
  }
}

/**
 * 중복 데이터 에러
 */
class DuplicateResourceError extends AppError {
  constructor(resource) {
    super(`${resource} already exists`, 409);
    this.name = 'DuplicateResourceError';
  }
}

/**
 * 데이터베이스 에러
 */
class DatabaseError extends AppError {
  constructor(message = '데이터베이스 오류가 발생했습니다.') {
    super(message, 500);
    this.name = 'DatabaseError';
  }
}

/**
 * 외부 서비스 에러
 */
class ExternalServiceError extends AppError {
  constructor(message = '외부 서비스 오류가 발생했습니다.') {
    super(message, 502);
    this.name = 'ExternalServiceError';
  }
}

/**
 * 에러 변환 유틸리티 함수
 */
const convertError = (error) => {
  if (error.name === 'ValidationError' && error.errors) {
    // Mongoose Validation Error
    const messages = Object.values(error.errors)
      .map(err => err.message)
      .join(', ');
    return new ValidationError(messages);
  }

  if (error.name === 'MongoError' && error.code === 11000) {
    // Mongoose Duplicate Key Error
    return new DuplicateResourceError('중복된 데이터가 존재합니다.');
  }

  if (error.name === 'CastError') {
    // Mongoose Cast Error
    return new ValidationError('잘못된 데이터 형식입니다.');
  }

  if (error.name === 'JsonWebTokenError') {
    return new AuthenticationError('유효하지 않은 토큰입니다.');
  }

  if (error.name === 'TokenExpiredError') {
    return new AuthenticationError('만료된 토큰입니다.');
  }

  // 이미 AppError 인스턴스인 경우 그대로 반환
  if (error instanceof AppError) {
    return error;
  }

  // 기타 예상치 못한 에러
  return new AppError('서버 오류가 발생했습니다.', 500);
};

/**
 * 데이터베이스 에러
 */
class RateLimitError extends AppError {
  constructor(message) {
    super(message, 429);
    this.name = 'RateLimitError';
  }
}

module.exports = {
  AppError,
  NotificationError,
  WebSocketError,
  CacheError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  ResourceNotFoundError,
  DuplicateResourceError,
  DatabaseError,
  ExternalServiceError,
  RateLimitError,
  convertError
}; 