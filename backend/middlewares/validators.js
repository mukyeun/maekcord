const { ValidationError } = require('../utils/errors');
const mongoose = require('mongoose');

const validators = {
  // ObjectId 유효성 검사 미들웨어
  validateObjectId: (req, res, next) => {
    const id = req.params.id;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 ID 형식입니다.'
      });
    }
    
    next();
  },

  validateLogin: (req, res, next) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return next(new ValidationError('이메일과 비밀번호를 모두 입력해주세요.'));
    }
    
    next();
  },

  validatePatient: (req, res, next) => {
    const { basicInfo } = req.body;
    
    // basicInfo가 있는 경우에만 검증
    if (basicInfo) {
      const { name, gender } = basicInfo;
      
      if (name && !name.trim()) {
        return next(new ValidationError('환자 이름은 필수 입력 항목입니다.'));
      }
      
      if (gender && !['male', 'female', ''].includes(gender)) {
        return next(new ValidationError('유효하지 않은 성별입니다.'));
      }
    }
    
    next();
  },

  validateAppointment: (req, res, next) => {
    const { patientId, dateTime, type } = req.body;
    
    if (!patientId || !dateTime || !type) {
      return next(new ValidationError('필수 입력 항목이 누락되었습니다.'));
    }
    
    next();
  },

  validateWaitlist: (req, res, next) => {
    const { patientId } = req.body;
    
    if (!patientId) {
      return next(new ValidationError('환자 정보는 필수 입력 항목입니다.'));
    }
    
    next();
  },

  validateRegistration: (req, res, next) => {
    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
      return next(new ValidationError('모든 필수 항목을 입력해주세요.'));
    }

    // 비밀번호 복잡도 검증
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
    if (!passwordRegex.test(password)) {
      return next(new ValidationError('비밀번호는 최소 6자 이상이며, 문자와 숫자를 포함해야 합니다.'));
    }
    
    next();
  },

  validatePasswordReset: (req, res, next) => {
    const { password, passwordConfirm } = req.body;
    
    if (!password || !passwordConfirm) {
      return next(new ValidationError('새 비밀번호와 확인 비밀번호를 모두 입력해주세요.'));
    }

    if (password !== passwordConfirm) {
      return next(new ValidationError('비밀번호가 일치하지 않습니다.'));
    }

    // 비밀번호 복잡도 검증
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
    if (!passwordRegex.test(password)) {
      return next(new ValidationError('비밀번호는 최소 6자 이상이며, 문자와 숫자를 포함해야 합니다.'));
    }
    
    next();
  }
};

module.exports = validators; 