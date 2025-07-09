const validators = require('./validators');

const {
  validateRegistration,
  validateLogin,
  validatePasswordReset
} = validators;

module.exports = {
  validateRegistration,
  validateLogin,
  validatePasswordReset
}; 