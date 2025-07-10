const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerOptions = require('./config/swagger');
const errorHandler = require('./middlewares/errorHandler');
const logger = require('./utils/logger');
const swaggerSpecs = require('./swagger/swagger');
const queueRoutes = require('./routes/queueRoutes');
const mongoose = require('mongoose');
const pulseMapRoutes = require('./routes/pulseMap');
const patientDataRoutes = require('./routes/patientData');
const dataExportRoutes = require('./routes/dataExport');
const pulseRoutes = require('./routes/pulse');
const visitRoutes = require('./routes/visitRoutes');
const testRoutes = require('./routes/test.routes');
const vitalSignRoutes = require('./routes/vitalSignRoutes');
const pulseDataRoutes = require('./routes/pulseDataRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const notificationRoutes = require('./routes/notification.routes');
const authRoutes = require('./routes/authRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const waitlistRoutes = require('./routes/waitlistRoutes');
const patientRoutes = require('./routes/patientRoutes');
const statisticsRoutes = require('./routes/statisticsRoutes');
const medicalRecordRoutes = require('./routes/medicalRecordRoutes');
const backupScheduler = require('./schedulers/backup.scheduler');
const backupRoutes = require('./routes/backup.routes');
const healthRoutes = require('./routes/health');

require('dotenv').config();

const app = express();

// Swagger 문서 생성
const swaggerSpec = swaggerJsdoc(swaggerOptions);

// 기본 미들웨어
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'x-timestamp',
    'x-client-version',
    'X-Timestamp',
    'X-Client-Version'
  ],
  credentials: true,
  optionsSuccessStatus: 200
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 요청 로깅
app.use((req, res, next) => {
  console.log('📡 요청 수신:', {
    method: req.method,
    originalUrl: req.originalUrl,
    path: req.path,
    baseUrl: req.baseUrl,
    query: req.query,
    body: ['POST', 'PUT', 'PATCH'].includes(req.method) ? req.body : undefined,
    timestamp: new Date().toISOString()
  });
  next();
});

// 라우터 등록
console.log('라우터 등록 시작...');

// 기본 API 라우트
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/waitlist', waitlistRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/medical-records', medicalRecordRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/backup', backupRoutes);

// 환자 데이터 관련 라우트
app.use('/api/patient-data', patientDataRoutes);
app.use('/api/data-export', dataExportRoutes);

// 진료 관련 라우트
app.use('/api/queues', queueRoutes);
app.use('/api/pulse-map', pulseMapRoutes);
app.use('/api/pulse', pulseRoutes);
app.use('/api', visitRoutes);
app.use('/api/test', testRoutes);
app.use('/api/vital-signs', vitalSignRoutes);
app.use('/api/pulse-data', pulseDataRoutes);
app.use('/api/doctors', doctorRoutes);

console.log('라우터 등록 완료');

// Swagger UI 설정
if (process.env.NODE_ENV === 'development') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: "병원 예약 관리 시스템 API 문서",
    customfavIcon: "/assets/favicon.ico"
  }));
}

// API 문서 JSON 형식으로 제공
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// 404 처리
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
      errors: err.errors ? Object.values(err.errors).map(e => ({
        field: e.path,
        message: e.message
      })) : [{ message: err.message }]
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

// 이메일 서비스 에러 처리
app.use((err, req, res, next) => {
  if (err.code === 'EAUTH') {
    console.log('이메일 서비스 비활성화됨 (개발 모드)');
    return next();
  }
  next(err);
});

// 백업 스케줄러 시작
backupScheduler.start();

module.exports = app;