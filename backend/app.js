const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerOptions = require('./config/swagger');
const errorHandler = require('./middlewares/errorHandler');
const logger = require('./utils/logger');
const swaggerSpecs = require('./swagger/swagger');

const app = express();

// Swagger 문서 생성
const swaggerSpec = swaggerJsdoc(swaggerOptions);

// 기본 미들웨어
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 요청 로깅
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

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
  res.status(404).json({
    success: false,
    message: '요청한 리소스를 찾을 수 없습니다.'
  });
});

// 에러 핸들러
app.use(errorHandler);

// 이메일 서비스 에러 처리
app.use((err, req, res, next) => {
  if (err.code === 'EAUTH') {
    console.log('이메일 서비스 비활성화됨 (개발 모드)');
    return next();
  }
  next(err);
});

module.exports = app;