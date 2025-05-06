const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const RefreshToken = require('../models/refreshToken');
const logger = require('../config/logger');
const authService = require('../services/authService');
const { USER_ROLES } = require('../config/constants');
const config = require('../config');
const { createError, ValidationError, AuthenticationError } = require('../utils/errors');
const crypto = require('crypto');
const sendEmail = require('../utils/email');

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { 
      userId: user._id, 
      username: user.username, 
      role: user.role 
    },
    process.env.JWT_SECRET,
    { 
      expiresIn: '24h',
      issuer: 'maekstation'
    }
  );

  const refreshToken = jwt.sign(
    { userId: user._id },
    process.env.JWT_REFRESH_SECRET,
    { 
      expiresIn: '7d',
      issuer: 'maekstation'
    }
  );

  return { accessToken, refreshToken };
};

const authController = {
  /**
   * 사용자 로그인
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // 사용자 찾기
      const user = await User.findOne({ email });
      if (!user) {
        throw new AuthenticationError('이메일 또는 비밀번호가 올바르지 않습니다.');
      }

      // 계정 잠금 확인
      if (user.isLocked) {
        throw new AuthenticationError(
          `계정이 잠겼습니다. ${new Date(user.lockUntil).toLocaleString()}까지 기다려주세요.`
        );
      }

      // 비밀번호 확인
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        await user.incLoginAttempts();
        throw new AuthenticationError('이메일 또는 비밀번호가 올바르지 않습니다.');
      }

      // 로그인 성공 처리
      await user.successfulLogin();

      // 토큰 생성
      const token = user.generateAuthToken();

      logger.info(`User logged in: ${email}`);

      res.json({
        success: true,
        message: '로그인되었습니다.',
        data: {
          token,
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role
          }
        }
      });
    } catch (error) {
      logger.error('Login failed:', error);
      next(error);
    }
  },

  /**
   * 토큰 갱신
   */
  async refreshToken(req, res, next) {
    try {
      const { id, role } = req.user;  // auth 미들웨어에서 설정됨

      // 새 토큰 생성
      const newToken = jwt.sign(
        { id, role },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      res.json({
        success: true,
        data: { token: newToken }
      });

      logger.info(`Token refreshed for user: ${id}`);
    } catch (error) {
      next(error);
    }
  },

  logout: async (req, res) => {
    try {
      const { userId } = req.user;
      
      // 리프레시 토큰 삭제
      await RefreshToken.findOneAndDelete({ userId });

      res.json({
        success: true,
        message: '로그아웃되었습니다.'
      });
    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: '로그아웃 처리 중 오류가 발생했습니다.'
      });
    }
  },

  // 사용자 등록 (관리자 전용)
  register: async (req, res, next) => {
    try {
      const { email, password, name, role } = req.body;

      // 이메일 중복 체크
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new ValidationError('이미 등록된 이메일입니다.');
      }

      // 사용자 생성
      const user = new User({
        email,
        password,
        name,
        role: role || 'staff'
      });

      await user.save();

      logger.info(`New user registered: ${email}`);

      // 토큰 생성
      const token = user.generateAuthToken();

      res.status(201).json({
        success: true,
        message: '회원가입이 완료되었습니다.',
        data: {
          token,
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role
          }
        }
      });
    } catch (error) {
      logger.error('Registration failed:', error);
      next(error);
    }
  },

  // 사용자 정보 업데이트
  updateUser: async (req, res) => {
    try {
      const { userId } = req.params;
      const updateData = req.body;

      // 권한 확인 (본인 또는 관리자만 수정 가능)
      if (req.user.role !== USER_ROLES.ADMIN && req.user.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized access'
        });
      }

      const updatedUser = await authService.updateUser(userId, updateData);

      res.json({
        success: true,
        data: updatedUser
      });
    } catch (error) {
      logger.error('Update user controller error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Update failed'
      });
    }
  },

  // 사용자 비활성화 (관리자 전용)
  deactivateUser: async (req, res) => {
    try {
      const { userId } = req.params;

      // 관리자 권한 확인
      if (req.user.role !== USER_ROLES.ADMIN) {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }

      const deactivatedUser = await authService.deactivateUser(userId);

      res.json({
        success: true,
        data: deactivatedUser
      });
    } catch (error) {
      logger.error('Deactivate user controller error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Deactivation failed'
      });
    }
  },

  // 모든 사용자 조회 (관리자 전용)
  getAllUsers: async (req, res) => {
    try {
      // 관리자 권한 확인
      if (req.user.role !== USER_ROLES.ADMIN) {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }

      const users = await authService.getAllUsers();

      res.json({
        success: true,
        data: users
      });
    } catch (error) {
      logger.error('Get all users controller error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve users'
      });
    }
  },

  // 비밀번호 재설정 요청
  forgotPassword: async (req, res, next) => {
    try {
      const { email } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        throw new ValidationError('등록되지 않은 이메일입니다.');
      }

      // 재설정 토큰 생성
      const resetToken = crypto.randomBytes(32).toString('hex');
      user.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
      user.passwordResetExpires = Date.now() + 30 * 60 * 1000; // 30분

      await user.save();

      // 이메일 전송
      const resetURL = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;
      await sendEmail({
        email: user.email,
        subject: '비밀번호 재설정',
        message: `비밀번호를 재설정하려면 다음 링크를 클릭하세요: ${resetURL}`
      });

      logger.info(`Password reset requested for: ${email}`);

      res.json({
        success: true,
        message: '비밀번호 재설정 링크가 이메일로 전송되었습니다.'
      });
    } catch (error) {
      logger.error('Password reset request failed:', error);
      next(error);
    }
  },

  // 비밀번호 재설정
  resetPassword: async (req, res, next) => {
    try {
      const { token } = req.params;
      const { password } = req.body;

      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
      });

      if (!user) {
        throw new ValidationError('토큰이 유효하지 않거나 만료되었습니다.');
      }

      user.password = password;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      logger.info(`Password reset completed for: ${user.email}`);

      res.json({
        success: true,
        message: '비밀번호가 재설정되었습니다.'
      });
    } catch (error) {
      logger.error('Password reset failed:', error);
      next(error);
    }
  }
};

module.exports = authController;
