const { errorHandler, notFound } = require('../../middleware/error');
const {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  DuplicateError
} = require('../../utils/errors');

describe('Error Middleware Test', () => {
  let mockReq;
  let mockRes;
  let nextFunction;

  beforeEach(() => {
    mockReq = {
      originalUrl: '/api/test'
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    nextFunction = jest.fn();
  });

  describe('notFound Middleware', () => {
    it('should create not found error for undefined routes', () => {
      notFound(mockReq, mockRes, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.any(NotFoundError)
      );
      expect(nextFunction.mock.calls[0][0].message)
        .toContain('/api/test');
    });
  });

  describe('errorHandler Middleware', () => {
    describe('Development Environment', () => {
      beforeAll(() => {
        process.env.NODE_ENV = 'development';
      });

      it('should handle AppError instances', () => {
        const error = new AppError('테스트 에러', 400);
        
        errorHandler(error, mockReq, mockRes, nextFunction);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          error: {
            statusCode: 400,
            status: 'fail',
            message: '테스트 에러',
            stack: expect.any(String)
          }
        });
      });

      it('should handle ValidationError', () => {
        const error = new ValidationError('유효성 검사 실패');
        
        errorHandler(error, mockReq, mockRes, nextFunction);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          error: {
            statusCode: 400,
            status: 'fail',
            message: '유효성 검사 실패',
            stack: expect.any(String)
          }
        });
      });

      it('should handle Mongoose ValidationError', () => {
        const error = {
          name: 'ValidationError',
          errors: {
            name: {
              message: '이름은 필수 항목입니다.'
            },
            email: {
              message: '유효한 이메일 주소를 입력하세요.'
            }
          }
        };

        errorHandler(error, mockReq, mockRes, nextFunction);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          error: {
            statusCode: 400,
            status: 'fail',
            message: '이름은 필수 항목입니다., 유효한 이메일 주소를 입력하세요.',
            stack: expect.any(String)
          }
        });
      });

      it('should handle Mongoose CastError', () => {
        const error = {
          name: 'CastError',
          path: '_id',
          value: 'invalid-id'
        };

        errorHandler(error, mockReq, mockRes, nextFunction);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json.mock.calls[0][0].error.message)
          .toContain('잘못된 형식의 ID');
      });

      it('should handle Mongoose Duplicate Key Error', () => {
        const error = {
          name: 'MongoError',
          code: 11000,
          keyValue: { email: 'test@example.com' }
        };

        errorHandler(error, mockReq, mockRes, nextFunction);

        expect(mockRes.status).toHaveBeenCalledWith(409);
        expect(mockRes.json.mock.calls[0][0].error.message)
          .toContain('중복된 데이터');
      });

      it('should handle JWT Errors', () => {
        const jwtErrors = [
          { name: 'JsonWebTokenError', message: '유효하지 않은 토큰입니다.' },
          { name: 'TokenExpiredError', message: '만료된 토큰입니다.' }
        ];

        jwtErrors.forEach(error => {
          errorHandler(error, mockReq, mockRes, nextFunction);

          expect(mockRes.status).toHaveBeenCalledWith(401);
          expect(mockRes.json.mock.calls[0][0].error.message)
            .toBe(error.message);
        });
      });
    });

    describe('Production Environment', () => {
      beforeAll(() => {
        process.env.NODE_ENV = 'production';
      });

      it('should not include stack trace in production', () => {
        const error = new AppError('테스트 에러', 400);
        
        errorHandler(error, mockReq, mockRes, nextFunction);

        expect(mockRes.json.mock.calls[0][0].error.stack)
          .toBeUndefined();
      });

      it('should handle unknown errors safely', () => {
        const error = new Error('예상치 못한 에러');
        
        errorHandler(error, mockReq, mockRes, nextFunction);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json.mock.calls[0][0].error.message)
          .toBe('서버 오류가 발생했습니다.');
      });
    });

    describe('Error Response Format', () => {
      it('should maintain consistent error response format', () => {
        const errors = [
          new ValidationError('유효성 검사 실패'),
          new AuthenticationError('인증 실패'),
          new AuthorizationError('권한 없음'),
          new NotFoundError('리소스를 찾을 수 없음'),
          new DuplicateError('중복된 데이터')
        ];

        errors.forEach(error => {
          errorHandler(error, mockReq, mockRes, nextFunction);

          const response = mockRes.json.mock.calls[0][0];
          expect(response).toHaveProperty('success', false);
          expect(response).toHaveProperty('error');
          expect(response.error).toHaveProperty('statusCode');
          expect(response.error).toHaveProperty('status');
          expect(response.error).toHaveProperty('message');
        });
      });
    });

    describe('Error Logging', () => {
      it('should log server errors appropriately', () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        const serverError = new Error('심각한 서버 오류');
        
        errorHandler(serverError, mockReq, mockRes, nextFunction);

        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
      });
    });
  });
}); 