const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');

// 스키마 정의
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    sparse: true
  },
  password: {
    type: String,
    required: [true, '비밀번호는 필수 입력 항목입니다.'],
    minlength: [6, '비밀번호는 최소 6자 이상이어야 합니다.'],
    select: false // 기본적으로 password 필드는 조회되지 않음
  },
  role: {
    type: String,
    enum: {
      values: ['admin', 'doctor', 'staff'],
      message: '유효하지 않은 역할입니다.'
    },
    default: 'staff'
  },
  name: {
    type: String,
    required: [true, '이름은 필수 입력 항목입니다.'],
    trim: true
  },
  email: {
    type: String,
    required: [true, '이메일은 필수 입력 항목입니다.'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, '유효한 이메일 주소를 입력해주세요.']
  },
  phone: {
    type: String,
    required: true,
    default: '010-0000-0000'
  },
  department: String,
  specialization: String,
  licenseNumber: String,
  active: {
    type: Boolean,
    default: true
  },
  refreshToken: String,
  status: {
    type: String,
    enum: {
      values: ['active', 'inactive'],
      message: '유효하지 않은 상태값입니다.'
    },
    default: 'active'
  },
  lastLogin: {
    type: Date
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 인덱스 설정
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });

// 가상 필드: 계정 잠금 여부
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// 비밀번호 해싱 미들웨어
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    
    if (this.isModified('password') && !this.isNew) {
      this.passwordChangedAt = Date.now() - 1000;
    }
    next();
  } catch (error) {
    next(error);
  }
});

// 비밀번호 검증 메서드
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// JWT 토큰 생성
userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { 
      id: this._id,
      email: this.email,
      role: this.role
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
};

// 로그인 시도 처리
userSchema.methods.incLoginAttempts = async function() {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }
  const updates = { $inc: { loginAttempts: 1 } };
  if (this.loginAttempts + 1 >= config.security.maxLoginAttempts) {
    updates.$set = {
      lockUntil: Date.now() + config.security.lockTime
    };
  }
  return this.updateOne(updates);
};

// 로그인 성공 처리
userSchema.methods.successfulLogin = function() {
  return this.updateOne({
    $set: { lastLogin: new Date() },
    $unset: { lockUntil: 1 },
    $set: { loginAttempts: 0 }
  });
};

// updatedAt 자동 갱신
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// 정적 메서드
userSchema.statics = {
  // 이메일로 사용자 찾기 (비밀번호 포함)
  findByEmail: function(email) {
    return this.findOne({ email }).select('+password');
  }
};

// 모델이 이미 존재하는지 확인
const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;
