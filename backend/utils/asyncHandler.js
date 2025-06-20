/**
 * Express 미들웨어에서 비동기 함수의 에러를 처리하기 위한 래퍼 함수
 * @param {Function} fn - 비동기 라우터 함수
 * @returns {Function} - 에러 처리가 포함된 미들웨어 함수
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next))
    .catch((error) => {
      console.error('❌ 비동기 처리 중 오류:', error);
      next(error);
    });
};

module.exports = asyncHandler; 