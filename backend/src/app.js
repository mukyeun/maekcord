const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const logger = require('./utils/logger');
const queueRoutes = require('./routes/queueRoutes');
require('dotenv').config();

// Mongoose deprecation 경고 제거
mongoose.set('strictQuery', false);

const app = express();

// 기본 미들웨어
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 요청 로깅
app.use((req, res, next) => {
  logger.info(`📡 ${req.method} ${req.path}`, {
    method: req.method,
    path: req.path,
    query: req.query,
    body: ['POST', 'PUT', 'PATCH'].includes(req.method) ? req.body : undefined,
    timestamp: new Date().toISOString()
  });
  next();
});

// MongoDB 연결 설정
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => logger.info('✅ MongoDB Connected Successfully'))
.catch(err => logger.error('❌ MongoDB Connection Error:', err));

// API 라우터
const authRoutes = require('./routes/authRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const waitlistRoutes = require('./routes/waitlistRoutes');
const patientRoutes = require('./routes/patientRoutes');
const statisticsRoutes = require('./routes/statisticsRoutes');

// 라우터 등록
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/waitlist', waitlistRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/queues', queueRoutes);

// 404 처리 - 모든 라우터 등록 후에 위치
app.use((req, res) => {
  logger.warn(`❌ 404 Not Found: ${req.method} ${req.path}`, {
    method: req.method,
    path: req.path,
    query: req.query,
    timestamp: new Date().toISOString()
  });
  res.status(404).json({
    success: false,
    message: `요청하신 경로 ${req.path}를 찾을 수 없습니다.`
  });
});

// 에러 핸들러
app.use((err, req, res, next) => {
  const errorId = Math.random().toString(36).substring(7);
  
  logger.error('❌ 서버 에러:', {
    errorId,
    method: req.method,
    path: req.path,
    error: {
      name: err.name,
      message: err.message,
      code: err.code,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    },
    timestamp: new Date().toISOString()
  });

  // MongoDB 관련 에러 처리
  if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        errorId,
        message: '데이터 중복 오류가 발생했습니다.',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
    return res.status(500).json({
      success: false,
      errorId,
      message: '데이터베이스 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }

  // Validation 에러 처리
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      errorId,
      message: '입력값 검증 오류가 발생했습니다.',
      errors: Object.values(err.errors).map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }

  // 기본 500 에러 응답
  res.status(500).json({
    success: false,
    errorId,
    message: '서버 에러가 발생했습니다.',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`✅ Server running on port ${PORT}`);
});

module.exports = app; 