const winston = require('winston');
const logger = require('../../utils/logger');
const path = require('path');
const fs = require('fs');

describe('Logger Utility Test', () => {
  const logDir = path.join(__dirname, '../../logs');
  const logFiles = {
    error: path.join(logDir, 'error.log'),
    combined: path.join(logDir, 'combined.log')
  };

  beforeAll(() => {
    // 로그 디렉토리 생성
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir);
    }
  });

  afterEach(() => {
    // 테스트 후 로그 파일 삭제
    Object.values(logFiles).forEach(file => {
      if (fs.existsSync(file)) {
        fs.truncateSync(file);
      }
    });
  });

  describe('Logger Configuration', () => {
    it('should be an instance of winston logger', () => {
      expect(logger).toHaveProperty('info');
      expect(logger).toHaveProperty('error');
      expect(logger).toHaveProperty('warn');
      expect(logger).toHaveProperty('debug');
    });

    it('should have correct log levels', () => {
      const levels = logger.levels;
      expect(levels).toEqual(winston.config.npm.levels);
    });

    it('should have multiple transports', () => {
      const transports = logger.transports;
      expect(transports).toHaveLength(3); // Console, error.log, combined.log
    });
  });

  describe('Logging Functionality', () => {
    it('should write info logs to combined.log', async () => {
      const testMessage = 'Test info message';
      logger.info(testMessage);

      // 로그 파일이 생성되고 내용이 기록될 때까지 잠시 대기
      await new Promise(resolve => setTimeout(resolve, 100));

      const logContent = fs.readFileSync(logFiles.combined, 'utf8');
      expect(logContent).toContain(testMessage);
      expect(logContent).toContain('info');
    });

    it('should write error logs to both error.log and combined.log', async () => {
      const testError = 'Test error message';
      logger.error(testError);

      await new Promise(resolve => setTimeout(resolve, 100));

      const errorLogContent = fs.readFileSync(logFiles.error, 'utf8');
      const combinedLogContent = fs.readFileSync(logFiles.combined, 'utf8');

      expect(errorLogContent).toContain(testError);
      expect(combinedLogContent).toContain(testError);
      expect(errorLogContent).toContain('error');
    });

    it('should format logs with timestamp and level', async () => {
      const testMessage = 'Test message with format';
      logger.info(testMessage);

      await new Promise(resolve => setTimeout(resolve, 100));

      const logContent = fs.readFileSync(logFiles.combined, 'utf8');
      
      // ISO 날짜 형식 확인
      expect(logContent).toMatch(/\d{4}-\d{2}-\d{2}/);
      // 시간 형식 확인
      expect(logContent).toMatch(/\d{2}:\d{2}:\d{2}/);
      // 로그 레벨 확인
      expect(logContent).toContain('info');
      // 메시지 확인
      expect(logContent).toContain(testMessage);
    });
  });

  describe('Error Handling', () => {
    it('should handle Error objects properly', async () => {
      const error = new Error('Test error object');
      logger.error(error);

      await new Promise(resolve => setTimeout(resolve, 100));

      const logContent = fs.readFileSync(logFiles.error, 'utf8');
      expect(logContent).toContain('Test error object');
      expect(logContent).toContain(error.stack);
    });

    it('should handle circular references', async () => {
      const circularObj = { a: 1 };
      circularObj.self = circularObj;

      logger.info('Circular object:', circularObj);

      await new Promise(resolve => setTimeout(resolve, 100));

      const logContent = fs.readFileSync(logFiles.combined, 'utf8');
      expect(logContent).toContain('[Circular]');
    });
  });

  describe('Production Environment', () => {
    const originalEnv = process.env.NODE_ENV;

    beforeAll(() => {
      process.env.NODE_ENV = 'production';
    });

    afterAll(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should use appropriate log level in production', () => {
      const prodLogger = require('../../utils/logger');
      expect(prodLogger.transports.find(t => t instanceof winston.transports.Console)
        .level).toBe('info');
    });
  });

  describe('Development Environment', () => {
    const originalEnv = process.env.NODE_ENV;

    beforeAll(() => {
      process.env.NODE_ENV = 'development';
    });

    afterAll(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should use appropriate log level in development', () => {
      const devLogger = require('../../utils/logger');
      expect(devLogger.transports.find(t => t instanceof winston.transports.Console)
        .level).toBe('debug');
    });
  });

  describe('Log Rotation', () => {
    it('should create new log file when size limit is reached', async () => {
      // 큰 로그 메시지 생성
      const largeMessage = 'x'.repeat(1024 * 1024); // 1MB
      
      // 여러 번 로깅하여 파일 크기 제한 초과
      for (let i = 0; i < 6; i++) {
        logger.info(largeMessage);
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      // 로그 파일이 여러 개로 분할되었는지 확인
      const logFiles = fs.readdirSync(logDir);
      const combinedLogs = logFiles.filter(file => file.startsWith('combined'));
      expect(combinedLogs.length).toBeGreaterThan(1);
    });
  });

  describe('Custom Log Formats', () => {
    it('should include request ID in logs when provided', async () => {
      const requestId = '123456';
      logger.info('Test message with request ID', { requestId });

      await new Promise(resolve => setTimeout(resolve, 100));

      const logContent = fs.readFileSync(logFiles.combined, 'utf8');
      expect(logContent).toContain(requestId);
    });

    it('should handle multiple arguments', async () => {
      logger.info('Message 1', 'Message 2', { key: 'value' });

      await new Promise(resolve => setTimeout(resolve, 100));

      const logContent = fs.readFileSync(logFiles.combined, 'utf8');
      expect(logContent).toContain('Message 1');
      expect(logContent).toContain('Message 2');
      expect(logContent).toContain('key');
      expect(logContent).toContain('value');
    });
  });
}); 