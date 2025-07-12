const { requestLogger, errorLogger } = require('../../middlewares/requestLogger');
const logger = require('../../utils/logger');

describe('Logger Middleware Test', () => {
  let mockReq;
  let mockRes;
  let nextFunction;
  let loggerInfoSpy;
  let loggerErrorSpy;

  beforeEach(() => {
    // Request mock
    mockReq = {
      method: 'GET',
      originalUrl: '/api/test',
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'test-agent',
        'x-forwarded-for': '192.168.1.1'
      },
      user: {
        _id: '507f1f77bcf86cd799439011',
        email: 'test@example.com'
      }
    };

    // Response mock
    mockRes = {
      statusCode: 200,
      getHeaders: jest.fn().mockReturnValue({
        'content-length': '1234',
        'content-type': 'application/json'
      }),
      on: jest.fn().mockImplementation((event, callback) => {
        if (event === 'finish') {
          callback();
        }
      })
    };

    // Next function mock
    nextFunction = jest.fn();

    // Logger spy
    loggerInfoSpy = jest.spyOn(logger, 'info').mockImplementation();
    loggerErrorSpy = jest.spyOn(logger, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Request Logger', () => {
    it('should log basic request information', () => {
      requestLogger(mockReq, mockRes, nextFunction);

      expect(loggerInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('GET /api/test')
      );
      expect(loggerInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('127.0.0.1')
      );
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should log user information when available', () => {
      requestLogger(mockReq, mockRes, nextFunction);

      expect(loggerInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('test@example.com')
      );
    });

    it('should log X-Forwarded-For header when available', () => {
      requestLogger(mockReq, mockRes, nextFunction);

      expect(loggerInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('192.168.1.1')
      );
    });

    it('should handle requests without user information', () => {
      delete mockReq.user;
      requestLogger(mockReq, mockRes, nextFunction);

      expect(loggerInfoSpy).toHaveBeenCalledWith(
        expect.not.stringContaining('test@example.com')
      );
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should log response information on finish', () => {
      requestLogger(mockReq, mockRes, nextFunction);

      expect(mockRes.on).toHaveBeenCalledWith('finish', expect.any(Function));
      expect(loggerInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('200')
      );
    });

    it('should log request body for POST/PUT/PATCH requests', () => {
      mockReq.method = 'POST';
      mockReq.body = { test: 'data' };
      
      requestLogger(mockReq, mockRes, nextFunction);

      expect(loggerInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('{"test":"data"}')
      );
    });

    it('should handle and sanitize sensitive information', () => {
      mockReq.method = 'POST';
      mockReq.body = {
        password: 'secret123',
        creditCard: '1234-5678-9012-3456',
        email: 'test@example.com'
      };

      requestLogger(mockReq, mockRes, nextFunction);

      const loggedData = loggerInfoSpy.mock.calls[0][0];
      expect(loggedData).not.toContain('secret123');
      expect(loggedData).not.toContain('1234-5678-9012-3456');
      expect(loggedData).toContain('[FILTERED]');
    });
  });

  describe('Error Logger', () => {
    it('should log error information', () => {
      const error = new Error('Test error');
      error.statusCode = 400;
      error.stack = 'Error stack trace';

      errorLogger(error, mockReq, mockRes, nextFunction);

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Test error')
      );
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('400')
      );
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error stack trace')
      );
      expect(nextFunction).toHaveBeenCalledWith(error);
    });

    it('should log request context with error', () => {
      const error = new Error('Test error');
      
      errorLogger(error, mockReq, mockRes, nextFunction);

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/test')
      );
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('127.0.0.1')
      );
    });

    it('should handle errors without stack trace', () => {
      const error = {
        message: 'Test error',
        statusCode: 400
      };

      errorLogger(error, mockReq, mockRes, nextFunction);

      expect(loggerErrorSpy).toHaveBeenCalled();
      expect(nextFunction).toHaveBeenCalledWith(error);
    });

    it('should log user context with error when available', () => {
      const error = new Error('Test error');
      
      errorLogger(error, mockReq, mockRes, nextFunction);

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('test@example.com')
      );
    });

    it('should handle and format different error types', () => {
      const errors = [
        new TypeError('Type error'),
        new RangeError('Range error'),
        { name: 'ValidationError', message: 'Invalid data' }
      ];

      errors.forEach(error => {
        errorLogger(error, mockReq, mockRes, nextFunction);
        
        expect(loggerErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining(error.message)
        );
      });
    });
  });

  describe('Performance Monitoring', () => {
    it('should log request duration', () => {
      const startTime = Date.now();
      mockReq.startTime = startTime;

      // 시뮬레이트 100ms 지연
      jest.spyOn(Date, 'now').mockReturnValue(startTime + 100);

      requestLogger(mockReq, mockRes, nextFunction);
      mockRes.on.mock.calls[0][1](); // finish 이벤트 트리거

      expect(loggerInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('100ms')
      );
    });

    it('should identify slow requests', () => {
      const startTime = Date.now();
      mockReq.startTime = startTime;

      // 시뮬레이트 1초 지연
      jest.spyOn(Date, 'now').mockReturnValue(startTime + 1000);

      requestLogger(mockReq, mockRes, nextFunction);
      mockRes.on.mock.calls[0][1](); // finish 이벤트 트리거

      expect(loggerInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('SLOW REQUEST')
      );
    });
  });

  describe('Environment Specific Logging', () => {
    it('should adjust log level based on environment', () => {
      const originalEnv = process.env.NODE_ENV;
      
      // Development 환경
      process.env.NODE_ENV = 'development';
      requestLogger(mockReq, mockRes, nextFunction);
      expect(loggerInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('test-agent')
      );

      // Production 환경
      process.env.NODE_ENV = 'production';
      loggerInfoSpy.mockClear();
      requestLogger(mockReq, mockRes, nextFunction);
      expect(loggerInfoSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('test-agent')
      );

      process.env.NODE_ENV = originalEnv;
    });
  });
}); 