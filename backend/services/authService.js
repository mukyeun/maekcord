const User = require('../models/User');
const jwtConfig = require('../config/jwtConfig');
const logger = require('../utils/logger');
const { USER_ROLES } = require('../config/constants');

const authService = {
  // 사용자 로그인
  login: async (username, password) => {
    try {
      // 사용자 찾기
      const user = await User.findOne({ username });
      if (!user) {
        throw new Error('User not found');
      }

      // 계정 활성화 상태 확인
      if (!user.isActive) {
        throw new Error('Account is disabled');
      }

      // 비밀번호 확인
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        throw new Error('Invalid password');
      }

      // 마지막 로그인 시간 업데이트
      user.lastLogin = new Date();
      await user.save();

      // JWT 토큰 생성
      const token = jwtConfig.generateToken({
        userId: user._id,
        username: user.username,
        role: user.role
      });

      return {
        token,
        user: user.toJSON()
      };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  },

  // 사용자 등록 (관리자 전용)
  register: async (userData) => {
    try {
      // 기존 사용자 확인
      const existingUser = await User.findOne({
        $or: [
          { username: userData.username },
          { email: userData.email }
        ]
      });

      if (existingUser) {
        throw new Error('Username or email already exists');
      }

      // 새 사용자 생성
      const user = new User(userData);
      await user.save();

      return user.toJSON();
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  },

  // 사용자 정보 업데이트
  updateUser: async (userId, updateData) => {
    try {
      // 비밀번호가 포함된 경우 해싱
      if (updateData.password) {
        const user = await User.findById(userId);
        user.password = updateData.password;
        await user.save();
        delete updateData.password;
      }

      // 나머지 정보 업데이트
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!updatedUser) {
        throw new Error('User not found');
      }

      return updatedUser.toJSON();
    } catch (error) {
      logger.error('Update user error:', error);
      throw error;
    }
  },

  // 사용자 비활성화
  deactivateUser: async (userId) => {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { $set: { isActive: false } },
        { new: true }
      );

      if (!user) {
        throw new Error('User not found');
      }

      return user.toJSON();
    } catch (error) {
      logger.error('Deactivate user error:', error);
      throw error;
    }
  },

  // 관리자용: 모든 사용자 조회
  getAllUsers: async () => {
    try {
      return await User.find({ role: { $ne: USER_ROLES.ADMIN } })
        .select('-password')
        .sort({ createdAt: -1 });
    } catch (error) {
      logger.error('Get all users error:', error);
      throw error;
    }
  }
};

module.exports = authService;
