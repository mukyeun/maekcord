const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../config/logger');
const User = require('../models/User');

// JWT 토큰 검증 미들웨어
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "인증 토큰이 필요합니다."
    });
  }

  jwt.verify(token, config.jwt.secret, (err, decoded) => {
    if (err) {
      logger.error('Token verification error:', err);
      return res.status(403).json({
        success: false,
        message: "유효하지 않은 토큰입니다."
      });
    }

    req.user = decoded;
    next();
  });
};

// 역할 기반 접근 제어 미들웨어
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "인증이 필요합니다."
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "접근 권한이 없습니다."
      });
    }

    next();
  };
};

// Express 미들웨어로 내보내기
module.exports = {
  authenticateToken,
  authorizeRoles
}; 