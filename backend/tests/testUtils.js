const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config');

const createTestUser = async (userData) => {
  const user = new User(userData);
  await user.save();
  return user;
};

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
};

module.exports = {
  createTestUser,
  generateToken
}; 