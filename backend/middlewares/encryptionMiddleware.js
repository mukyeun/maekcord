const security = require('../config/security');
const logger = require('../utils/logger');

const encryptionMiddleware = {
  encryptSensitiveData: (fields = []) => {
    return (req, res, next) => {
      try {
        fields.forEach(field => {
          if (req.body[field]) {
            req.body[field] = security.encrypt(req.body[field]);
          }
        });
        next();
      } catch (error) {
        logger.error('Encryption error:', error);
        return res.status(500).json({ message: 'Encryption failed' });
      }
    };
  },

  decryptSensitiveData: (fields = []) => {
    return (req, res, next) => {
      try {
        fields.forEach(field => {
          if (res.locals.data && res.locals.data[field]) {
            res.locals.data[field] = security.decrypt(res.locals.data[field]);
          }
        });
        next();
      } catch (error) {
        logger.error('Decryption error:', error);
        return res.status(500).json({ message: 'Decryption failed' });
      }
    };
  }
};

module.exports = encryptionMiddleware;
