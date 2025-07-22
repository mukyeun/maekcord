const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// 로그 레벨 정의
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6
};

// 로그 색상 정의
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  verbose: 'cyan',
  debug: 'blue',
  silly: 'white'
};

// 커스텀 포맷 정의
const customFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    if (stack) {
      log += `\n${stack}`;
    }
    
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

// 프로덕션용 포맷 (민감한 정보 제거)
const productionFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    // 민감한 정보 필터링
    const sanitizedMeta = { ...meta };
    delete sanitizedMeta.password;
    delete sanitizedMeta.token;
    delete sanitizedMeta.secret;
    delete sanitizedMeta.authorization;
    
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    if (stack) {
      log += `\n${stack}`;
    }
    
    if (Object.keys(sanitizedMeta).length > 0) {
      log += `\n${JSON.stringify(sanitizedMeta, null, 2)}`;
    }
    
    return log;
  })
);

// 로그 디렉토리 생성
const logDir = path.join(__dirname, '../logs');

// 환경별 로그 레벨 설정
const getLogLevel = () => {
  const env = process.env.NODE_ENV || 'development';
  const logLevel = process.env.LOG_LEVEL || 'info';
  
  if (env === 'production') {
    return logLevel === 'debug' ? 'info' : logLevel; // 프로덕션에서는 debug 레벨 제한
  }
  
  return logLevel;
};

// 트랜스포트 설정
const transports = [];

// 콘솔 출력 (개발 환경에서만 상세)
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      level: getLogLevel(),
      format: winston.format.combine(
        winston.format.colorize({ colors: logColors }),
        winston.format.simple(),
        winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
          let log = `${timestamp} [${level}]: ${message}`;
          
          if (stack) {
            log += `\n${stack}`;
          }
          
          if (Object.keys(meta).length > 0) {
            log += `\n${JSON.stringify(meta, null, 2)}`;
          }
          
          return log;
        })
      )
    })
  );
}

// 파일 출력 설정
const fileTransports = [
  // 에러 로그
  new DailyRotateFile({
    filename: path.join(logDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    maxSize: '20m',
    maxFiles: '14d',
    format: process.env.NODE_ENV === 'production' ? productionFormat : customFormat
  }),
  
  // 전체 로그
  new DailyRotateFile({
    filename: path.join(logDir, 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '30d',
    format: process.env.NODE_ENV === 'production' ? productionFormat : customFormat
  }),
  
  // HTTP 요청 로그
  new DailyRotateFile({
    filename: path.join(logDir, 'http-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'http',
    maxSize: '20m',
    maxFiles: '7d',
    format: process.env.NODE_ENV === 'production' ? productionFormat : customFormat
  }),
  
  // 성능 로그
  new DailyRotateFile({
    filename: path.join(logDir, 'performance-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'info',
    maxSize: '20m',
    maxFiles: '7d',
    format: process.env.NODE_ENV === 'production' ? productionFormat : customFormat
  })
];

transports.push(...fileTransports);

// 로거 생성
const logger = winston.createLogger({
  level: getLogLevel(),
  levels: logLevels,
  format: process.env.NODE_ENV === 'production' ? productionFormat : customFormat,
  transports,
  exitOnError: false
});

// 성능 모니터링 함수
const performanceLogger = {
  startTimer: (operation) => {
    const start = Date.now();
    return {
      end: () => {
        const duration = Date.now() - start;
        logger.info(`⏱️ ${operation} 완료`, {
          operation,
          duration: `${duration}ms`,
          timestamp: new Date().toISOString()
        });
        return duration;
      }
    };
  },
  
  logQuery: (collection, operation, duration, query = {}) => {
    logger.info(`🗄️ 데이터베이스 쿼리`, {
      collection,
      operation,
      duration: `${duration}ms`,
      query: JSON.stringify(query),
      timestamp: new Date().toISOString()
    });
  },
  
  logApiCall: (method, path, duration, statusCode, userId = null) => {
    const level = statusCode >= 400 ? 'warn' : 'info';
    logger[level](`🌐 API 호출`, {
      method,
      path,
      duration: `${duration}ms`,
      statusCode,
      userId,
      timestamp: new Date().toISOString()
    });
  }
};

// 에러 추적 함수
const errorTracker = {
  trackError: (error, context = {}) => {
    logger.error('❌ 에러 발생', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code
      },
      context,
      timestamp: new Date().toISOString()
    });
  },
  
  trackValidationError: (errors, field, value) => {
    logger.warn('⚠️ 유효성 검사 실패', {
      field,
      value: typeof value === 'string' ? value.substring(0, 100) : value,
      errors,
      timestamp: new Date().toISOString()
    });
  },
  
  trackSecurityEvent: (event, details) => {
    logger.warn('🔒 보안 이벤트', {
      event,
      details,
      timestamp: new Date().toISOString()
    });
  }
};

// 시스템 상태 모니터링
const systemMonitor = {
  logMemoryUsage: () => {
    const memUsage = process.memoryUsage();
    logger.info('💾 메모리 사용량', {
      rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
      timestamp: new Date().toISOString()
    });
  },
  
  logCpuUsage: (cpuUsage) => {
    logger.info('🖥️ CPU 사용량', {
      user: `${cpuUsage.user}ms`,
      system: `${cpuUsage.system}ms`,
      timestamp: new Date().toISOString()
    });
  }
};

// 로그 정리 함수
const cleanupLogs = async () => {
  try {
    logger.info('🧹 로그 정리 시작');
    
    // 30일 이상 된 로그 파일 삭제
    const fs = require('fs');
    const logFiles = fs.readdirSync(logDir);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    let deletedCount = 0;
    
    for (const file of logFiles) {
      const filePath = path.join(logDir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.mtime < thirtyDaysAgo) {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    }
    
    logger.info(`✅ 로그 정리 완료: ${deletedCount}개 파일 삭제됨`);
  } catch (error) {
    logger.error('❌ 로그 정리 실패:', error);
  }
};

// 주기적 로그 정리 (매일 자정)
if (process.env.NODE_ENV === 'production') {
  setInterval(cleanupLogs, 24 * 60 * 60 * 1000); // 24시간
}

module.exports = {
  logger,
  performanceLogger,
  errorTracker,
  systemMonitor,
  cleanupLogs
};
