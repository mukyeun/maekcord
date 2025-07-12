const jwt = require('jsonwebtoken');
const { UnauthorizedAccessError } = require('../errors/domain.errors');
const logger = require('../utils/logger');

/**
 * 인증 미들웨어
 * JWT 토큰을 검증하고 사용자 정보를 req.user에 추가
 */
const authMiddleware = async (req, res, next) => {
  // 개발 환경에서는 인증을 통과시킴
  if (process.env.NODE_ENV === 'development') {
    req.user = {
      id: 'dev-user',
      name: 'Developer',
      role: 'doctor',
      isAdmin: true
    };
    return next();
  }

  try {
    // 헤더에서 토큰 추출
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedAccessError();
    }

    const token = authHeader.split(' ')[1];

    // 토큰 검증
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // request 객체에 사용자 정보 추가
    req.user = decoded;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      logger.logSecurity('invalid_token', {
        error: error.message,
        endpoint: req.originalUrl
      });
      return next(new UnauthorizedAccessError());
    }
    next(error);
  }
};

// 개발 환경용 임시 인증 미들웨어
const authenticateAdmin = async (req, res, next) => {
  // 개발 환경에서는 인증을 통과시킴
  if (process.env.NODE_ENV !== 'production') {
    req.user = {
      id: 'admin',
      isAdmin: true
    };
    return next();
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedAccessError();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'development-secret');

    if (!decoded.isAdmin) {
      logger.logSecurity('unauthorized_admin_access', {
        userId: decoded.id,
        endpoint: req.originalUrl
      });
      throw new UnauthorizedAccessError();
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      logger.logSecurity('invalid_token', {
        error: error.message,
        endpoint: req.originalUrl
      });
      return next(new UnauthorizedAccessError());
    }
    next(error);
  }
};

// 개발 환경용 임시 사용자 인증 미들웨어
const authenticateUser = async (req, res, next) => {
  // 개발 환경에서는 인증을 통과시킴
  if (process.env.NODE_ENV !== 'production') {
    req.user = {
      id: 'user',
      isAdmin: false
    };
    return next();
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedAccessError();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'development-secret');

    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      logger.logSecurity('invalid_token', {
        error: error.message,
        endpoint: req.originalUrl
      });
      return next(new UnauthorizedAccessError());
    }
    next(error);
  }
};

module.exports = {
  authMiddleware,
  authenticateAdmin,
  authenticateUser
}; 