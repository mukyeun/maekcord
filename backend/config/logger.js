const winston = require('winston');
const moment = require('moment-timezone');

// 한국 시간대 설정
moment.tz.setDefault('Asia/Seoul');

// 로그 레벨 정의
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

// 로그 포맷 설정
const format = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// 로거 생성
const logger = winston.createLogger({
  level: 'info',
  format: format,
  defaultMeta: { service: 'maekstation-backend' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

module.exports = logger; 