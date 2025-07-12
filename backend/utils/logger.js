const winston = require('winston');
const path = require('path');
const fs = require('fs');

// 테스트 환경 확인
const isTest = process.env.NODE_ENV === 'test';

// 로그 포맷 정의
const logFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss:ms'
    }),
    winston.format.json(),
    winston.format.printf(
        info => `${info.timestamp} ${info.level}: ${info.message}`
    )
);

// 로거 설정
const logger = winston.createLogger({
    level: isTest ? 'error' : 'info',
    format: logFormat,
    transports: []
});

// 테스트 환경이 아닐 때만 파일 transport 추가
if (!isTest) {
    // 로그 디렉토리 생성
    const logDir = 'logs';
    try {
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir);
        }

        logger.add(
            new winston.transports.File({
                filename: path.join(logDir, 'error.log'),
                level: 'error',
                maxsize: 5242880, // 5MB
                maxFiles: 5
            })
        );
        
        logger.add(
            new winston.transports.File({
                filename: path.join(logDir, 'combined.log'),
                maxsize: 5242880, // 5MB
                maxFiles: 5
            })
        );
    } catch (error) {
        console.error('로그 디렉토리 생성 실패:', error);
    }
}

// 개발 환경이나 테스트 환경에서는 콘솔 출력 추가
if (process.env.NODE_ENV !== 'production' || isTest) {
    logger.add(
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    );
}

module.exports = logger;
