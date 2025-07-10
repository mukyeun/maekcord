const { UnauthorizedAccessError } = require('../errors/domain.errors');

/**
 * 사용자 역할 확인 미들웨어
 * @param {string[]} allowedRoles - 허용된 역할 배열
 */
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    // 개발 환경에서는 모든 역할 허용
    if (process.env.NODE_ENV === 'development') {
      return next();
    }

    if (!req.user) {
      return next(new UnauthorizedAccessError('인증되지 않은 사용자입니다.'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new UnauthorizedAccessError('이 작업을 수행할 권한이 없습니다.'));
    }

    next();
  };
};

module.exports = {
  checkRole
}; 