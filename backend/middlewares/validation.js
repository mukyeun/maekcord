const ApiError = require('../utils/ApiError');

// Joi 스키마 검증 미들웨어
const validate = (schema) => (req, res, next) => {
  try {
    const validSchema = pick(schema, ['params', 'query', 'body']);
    const object = pick(req, Object.keys(validSchema));
    
    // Joi 스키마 검증
    const { value, error } = schema.validate(object);

    if (error) {
      const errorMessage = error.details.map((detail) => detail.message).join(', ');
      return next(new ApiError(400, errorMessage));
    }
    
    Object.assign(req, value);
    return next();
  } catch (err) {
    // 스키마가 Joi 스키마가 아닌 경우 처리
    console.error('Validation middleware error:', err);
    return next(new ApiError(500, 'Validation schema error'));
  }
};

const pick = (object, keys) => {
  return keys.reduce((obj, key) => {
    if (object && Object.prototype.hasOwnProperty.call(object, key)) {
      obj[key] = object[key];
    }
    return obj;
  }, {});
};

// 기존 validators
const validators = require('./validators');

const {
  validateRegistration,
  validateLogin,
  validatePasswordReset
} = validators;

module.exports = {
  validate,
  validateRegistration,
  validateLogin,
  validatePasswordReset
}; 