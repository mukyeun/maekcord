const jwt = require('jsonwebtoken');

const jwtConfig = {
  secret: process.env.JWT_SECRET || 'your_jwt_secret_key',
  options: {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    issuer: 'maekstation'
  },

  generateToken: (payload) => {
    return jwt.sign(payload, jwtConfig.secret, jwtConfig.options);
  },

  verifyToken: (token) => {
    try {
      const decoded = jwt.verify(token, jwtConfig.secret);
      return decoded;
    } catch (error) {
      console.log('Token verification error:', error);
      throw new Error('Invalid token');
    }
  }
};

module.exports = jwtConfig;
