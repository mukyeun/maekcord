const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');

// 개발 환경에서만 스택 트레이스 포함
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    message: err.message,
    errors: err.errors,
    conflictData: err.conflictData,
    stack: err.stack,
    error: err
  });
};

// 운영 환경에서는 민감한 정보 제외
const sendErrorProd = (err, res) => {
  // 운영상의 에러: 신뢰할 수 있는 에러 메시지 전송
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
      conflictData: err.conflictData
    });
  } 
  // 프로그래밍 에러: 자세한 내용 숨김
  else {
    logger.error('ERROR 💥', err);
    res.status(500).json({
      success: false,
      message: '서버에 문제가 발생했습니다.'
    });
  }
};

// 몽구스 에러 처리
const handleMongooseError = (err) => {
  if (err.name === 'CastError') {
    return new AppError('잘못된 데이터 형식입니다.', 400);
  }
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(el => el.message);
    return new AppError('입력값 검증에 실패했습니다.', 400, errors);
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return new AppError(`이미 존재하는 ${field} 입니다.`, 409);
  }
  return err;
};

// 전역 에러 핸들러
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;

  // 몽구스 에러 변환
  if (err.name === 'CastError' || err.name === 'ValidationError' || err.code === 11000) {
    err = handleMongooseError(err);
  }

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    sendErrorProd(err, res);
  }
};

module.exports = errorHandler;
