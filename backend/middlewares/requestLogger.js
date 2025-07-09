const logger = require('../utils/logger');

const requestLogger = (req, res, next) => {
  // 요청 시작 시간 기록
  req._startTime = Date.now();

  // 요청 로깅
  logger.logRequest(req);

  // 응답 완료 시 로깅
  res.on('finish', () => {
    const responseTime = Date.now() - req._startTime;
    logger.logResponse(req, res, responseTime);

    // 성능 메트릭 기록 (느린 요청 감지)
    if (responseTime > 1000) { // 1초 이상 걸린 요청
      logger.logPerformance('slow_request', responseTime, {
        method: req.method,
        path: req.path
      });
    }
  });

  next();
};

module.exports = requestLogger; 