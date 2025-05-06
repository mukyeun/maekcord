const { ValidationError } = require('../utils/errors');

const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      const { error } = schema.validate(req.body, {
        abortEarly: false,  // 모든 에러를 한번에 반환
        stripUnknown: true  // 알 수 없는 필드 제거
      });

      if (error) {
        const errors = error.details.map(detail => detail.message);
        throw new ValidationError('입력값 검증 실패', errors);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = validateRequest;
