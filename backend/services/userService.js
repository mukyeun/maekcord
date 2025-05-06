const User = require('../models/user');

const userService = {
  // 사용자 목록 조회
  getUsers: async () => {
    return await User.find({}).select('-password');
  },

  // 사용자 상세 정보 조회
  getUserDetail: async (userId) => {
    return await User.findById(userId).select('-password');
  },

  // 사용자 생성
  createUser: async (userData) => {
    return await User.create(userData);
  },

  // 사용자 정보 수정
  updateUser: async (userId, updateData) => {
    return await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select('-password');
  },

  // 사용자 삭제
  deleteUser: async (userId) => {
    return await User.findByIdAndDelete(userId);
  }
};

module.exports = userService; 