const User = require('../models/User');
const logger = require('../config/logger');
const userService = require('../services/userService');
const jwt = require('jsonwebtoken');

// 사용자 목록 조회
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({
      success: true,
      data: users,
      message: "사용자 목록 조회 성공"
    });
  } catch (error) {
    logger.error('Error in getUsers:', error);
    res.status(500).json({
      success: false,
      message: "사용자 목록 조회 중 오류가 발생했습니다."
    });
  }
};

// 사용자 상세 조회
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "사용자를 찾을 수 없습니다."
      });
    }
    res.json({
      success: true,
      data: user,
      message: "사용자 조회 성공"
    });
  } catch (error) {
    logger.error('Error in getUser:', error);
    res.status(500).json({
      success: false,
      message: "사용자 조회 중 오류가 발생했습니다."
    });
  }
};

// 사용자 생성
exports.createUser = async (req, res) => {
  try {
    const userData = req.body;
    
    // 필수 필드 검증
    if (!userData.username || !userData.password || !userData.name || !userData.role) {
      return res.status(400).json({
        success: false,
        message: '필수 정보가 누락되었습니다.'
      });
    }

    // 사용자 생성
    const user = await User.create(userData);

    // 비밀번호 제외하고 응답
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      data: userResponse
    });
  } catch (error) {
    logger.error('Create user error:', error);
    
    // MongoDB 중복 키 에러 처리
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: '이미 존재하는 사용자명입니다.'
      });
    }

    res.status(500).json({
      success: false,
      message: '사용자 생성 중 오류가 발생했습니다.'
    });
  }
};

// 사용자 정보 수정
exports.updateUser = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "사용자를 찾을 수 없습니다."
      });
    }

    // 본인 또는 관리자만 수정 가능
    if (req.user.role !== 'admin' && req.user.userId !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: "다른 사용자의 정보를 수정할 권한이 없습니다."
      });
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.phone = phone || user.phone;

    await user.save();

    res.json({
      success: true,
      data: user,
      message: "사용자 정보가 수정되었습니다."
    });
  } catch (error) {
    logger.error('Error in updateUser:', error);
    res.status(500).json({
      success: false,
      message: "사용자 정보 수정 중 오류가 발생했습니다."
    });
  }
};

// 사용자 삭제
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "사용자를 찾을 수 없습니다."
      });
    }

    await user.remove();

    res.json({
      success: true,
      message: "사용자가 삭제되었습니다."
    });
  } catch (error) {
    logger.error('Error in deleteUser:', error);
    res.status(500).json({
      success: false,
      message: "사용자 삭제 중 오류가 발생했습니다."
    });
  }
};

// 사용자 등록
exports.register = async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).json({
      success: true,
      data: user,
      message: "회원가입이 완료되었습니다."
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// 로그인
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: "아이디 또는 비밀번호가 일치하지 않습니다."
      });
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h', issuer: 'maekstation' }
    );

    res.json({
      success: true,
      data: { token },
      message: "로그인 되었습니다."
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 프로필 조회
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 프로필 수정
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      req.body,
      { new: true }
    ).select('-password');
    
    res.json({
      success: true,
      data: user,
      message: "프로필이 수정되었습니다."
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};