const jwtConfig = require('../config/jwtConfig');
const logger = require('../utils/logger');

const authMiddleware = {
  authenticate: (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ message: 'No token provided' });
      }

      const parts = authHeader.split(' ');
      if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({ message: 'Token format invalid' });
      }

      const token = parts[1];
      console.log('Received token:', token);

      const decoded = jwtConfig.verifyToken(token);
      req.user = decoded;
      next();
    } catch (error) {
      logger.error('Authentication error:', error);
      return res.status(401).json({ message: 'Invalid token' });
    }
  },

  authorize: (roles = []) => {
    return (req, res, next) => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: 'User not authenticated' });
        }

        if (roles.length && !roles.includes(req.user.role)) {
          return res.status(403).json({ message: 'Unauthorized access' });
        }

        next();
      } catch (error) {
        logger.error('Authorization error:', error);
        return res.status(403).json({ message: 'Authorization failed' });
      }
    };
  }
};

module.exports = authMiddleware; 