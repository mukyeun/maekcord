const {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  DuplicateError
} = require('../../utils/errors');

describe('Error Utilities Test', () => {
  describe('AppError', () => {
    it('should create base error with correct properties', () => {
      const error = new AppError('테스트 에러', 400);
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('테스트 에러');
      expect(error.statusCode).toBe(400);
      expect(error.status).toBe('fail');
      expect(error.isOperational).toBe(true);
    });

    it('should set status to error for 500 code', () => {
      const error = new AppError('서버 에러', 500);
      expect(error.status).toBe('error');
    });
  });

  describe('ValidationError', () => {
    it('should create validation error', () => {
      const error = new ValidationError('유효성 검사 실패');
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('유효성 검사 실패');
    });

    it('should handle validation details', () => {
      const details = {
        field: 'email',
        message: '유효한 이메일 주소를 입력하세요'
      };
      const error = new ValidationError('유효성 검사 실패', details);
      
      expect(error.details).toEqual(details);
    });
  });

  describe('AuthenticationError', () => {
    it('should create authentication error', () => {
      const error = new AuthenticationError('인증 실패');
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('인증 실패');
    });
  });

  describe('AuthorizationError', () => {
    it('should create authorization error', () => {
      const error = new AuthorizationError('권한 없음');
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(403);
      expect(error.message).toBe('권한 없음');
    });
  });

  describe('NotFoundError', () => {
    it('should create not found error', () => {
      const error = new NotFoundError('리소스를 찾을 수 없음');
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('리소스를 찾을 수 없음');
    });

    it('should format resource specific message', () => {
      const error = new NotFoundError('Patient', '507f1f77bcf86cd799439011');
      expect(error.message).toBe('ID가 507f1f77bcf86cd799439011인 Patient를 찾을 수 없습니다.');
    });
  });

  describe('DuplicateError', () => {
    it('should create duplicate error', () => {
      const error = new DuplicateError('중복된 데이터');
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(409);
      expect(error.message).toBe('중복된 데이터');
    });

    it('should format field specific message', () => {
      const error = new DuplicateError('email', 'test@example.com');
      expect(error.message).toBe('이미 사용 중인 email(test@example.com) 입니다.');
    });
  });

  describe('Error Stack Traces', () => {
    it('should capture stack traces', () => {
      const error = new AppError('테스트 에러');
      expect(error.stack).toBeDefined();
    });

    it('should preserve original stack trace', () => {
      function throwError() {
        throw new ValidationError('테스트 에러');
      }

      try {
        throwError();
      } catch (error) {
        expect(error.stack).toContain('throwError');
      }
    });
  });

  describe('Error Inheritance', () => {
    it('should maintain proper inheritance chain', () => {
      const errors = [
        new ValidationError('테스트'),
        new AuthenticationError('테스트'),
        new AuthorizationError('테스트'),
        new NotFoundError('테스트'),
        new DuplicateError('테스트')
      ];

      errors.forEach(error => {
        expect(error).toBeInstanceOf(AppError);
        expect(error).toBeInstanceOf(Error);
      });
    });
  });
}); 