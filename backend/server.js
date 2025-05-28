require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const logger = require('./utils/logger');
const config = require('./config');
const Patient = require('./models/Patient'); // 반드시 존재해야 함
const queueRoutes = require('./routes/queueRoutes');
const patientRoutes = require('./routes/patientRoutes');
const http = require('http');
const { initWebSocket } = require('./utils/wsServer');

const app = express();
const server = http.createServer(app);

// WebSocket 초기화
initWebSocket(server);

// CORS 설정
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 라우트 등록
app.use('/api/queues', queueRoutes);
app.use('/api/patients', patientRoutes);

// 기본 라우트 (테스트용)
app.get('/', (req, res) => {
  res.json({ message: 'API 서버가 정상적으로 실행 중입니다.' });
});

// 404 처리
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: `요청하신 경로 ${req.path}를 찾을 수 없습니다.` 
  });
});

// 에러 핸들링
app.use((err, req, res, next) => {
  console.error('서버 에러:', err);
  res.status(500).json({
    success: false,
    message: '서버 내부 오류가 발생했습니다.'
  });
});

// MongoDB 연결
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/maekcord', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB 연결 성공'))
.catch(err => console.error('❌ MongoDB 연결 실패:', err));

// 서버 시작
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
  console.log(`📡 WebSocket 서버: ws://localhost:${PORT}/ws`);
});

