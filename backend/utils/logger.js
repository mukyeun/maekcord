const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const config = require('../config');
const path = require('path');
const moment = require('moment-timezone');

// 로그 포맷 정의
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// 로그 파일 경로 설정
const logDir = path.dirname(config.logging.file);
const logFileName = path.basename(config.logging.file);

// 로그 레벨 정의
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

// 로그 색상 정의
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'blue'
};

winston.addColors(colors);

// 타임스탬프 포맷터
const timeStamp = () => moment().tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss.SSS');

// 로거 생성
const logger = winston.createLogger({
  levels,
  format: winston.format.combine(
    winston.format.timestamp({ format: timeStamp }),
    winston.format.json(),
    winston.format.prettyPrint()
  ),
  transports: [
    // 콘솔 출력
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
          (info) => `${info.timestamp} ${info.level}: ${info.message}`
        )
      )
    }),
    // 파일 출력 (에러)
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),
    // 파일 출력 (전체)
    new winston.transports.File({
      filename: 'logs/combined.log'
    })
  ]
});

// 개발 환경에서 추가 설정
if (config.nodeEnv !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// 로그 레벨별 래퍼 함수
const wrap = (level) => (message, meta = {}) => {
  if (typeof message === 'object') {
    logger[level]('', { ...message, ...meta });
  } else {
    logger[level](message, meta);
  }
};

// 편의성을 위한 래퍼 메서드
module.exports = {
  error: wrap('error'),
  warn: wrap('warn'),
  info: wrap('info'),
  debug: wrap('debug'),
  
  // HTTP 요청 로깅
  httpLogger: (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.info('HTTP Request', {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
        userAgent: req.get('user-agent')
      });
    });
    next();
  },

  // 에러 로깅
  errorLogger: (err, req, res, next) => {
    logger.error('Error', {
      error: err.message,
      stack: err.stack,
      method: req.method,
      url: req.url,
      body: req.body,
      user: req.user ? req.user.id : 'anonymous'
    });
    next(err);
  },

  // 원본 logger 인스턴스
  logger
};
