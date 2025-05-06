const jwt = require('jsonwebtoken');
const config = require('../config');
const { AuthenticationError } = require('../utils/errors');

/**
 * 인증 미들웨어
 * JWT 토큰을 검증하고 사용자 정보를 req.user에 추가
 */
const authMiddleware = async (req, res, next) => {
  try {
    // 헤더에서 토큰 추출
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('인증 토큰이 필요합니다.');
    }

    const token = authHeader.split(' ')[1];

    // 토큰 검증
    const decoded = jwt.verify(token, config.jwt.secret);

    // request 객체에 사용자 정보 추가
    req.user = {
      id: decoded.id,
      role: decoded.role
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      next(new AuthenticationError('유효하지 않은 토큰입니다.'));
    } else if (error.name === 'TokenExpiredError') {
      next(new AuthenticationError('만료된 토큰입니다.'));
    } else {
      next(error);
    }
  }
};

module.exports = authMiddleware; 