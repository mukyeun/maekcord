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
const WebSocket = require('ws');
const expressWs = require('express-ws');

const app = express();
expressWs(app);

// CORS 설정
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 라우트 등록
app.use('/api/patients', patientRoutes);
app.use('/api/queues', queueRoutes);

// 디버깅을 위한 로깅 미들웨어
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// MongoDB 연결
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/maekstation')
  .then(() => console.log('✅ MongoDB 연결 성공'))
  .catch(err => console.error('❌ MongoDB 연결 실패:', err));

// 에러 핸들링
app.use((err, req, res, next) => {
  console.error('서버 에러:', err);
  res.status(500).json({
    success: false,
    message: '서버 에러가 발생했습니다.',
    error: err.message
  });
});

// HTTP 서버 생성
const server = http.createServer(app);

// WebSocket 클라이언트 관리
const clients = new Set();

// WebSocket 엔드포인트 설정
app.ws('/ws', (ws, req) => {
  console.log('✅ 새로운 WebSocket 클라이언트 연결됨');
  clients.add(ws);

  // 연결 상태 확인
  ws.isAlive = true;
  const pingInterval = setInterval(() => {
    if (ws.isAlive === false) {
      clients.delete(ws);
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping();
  }, 30000);

  ws.on('pong', () => {
    ws.isAlive = true;
  });

  // 메시지 수신 처리
  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg);
      console.log('📨 수신된 메시지:', data);
      
      // 다른 클라이언트들에게 브로드캐스트
      clients.forEach((client) => {
        if (client !== ws && client.readyState === 1) { // WebSocket.OPEN = 1
          client.send(JSON.stringify(data));
        }
      });
    } catch (error) {
      console.error('메시지 처리 오류:', error);
    }
  });

  // 연결 종료 처리
  ws.on('close', () => {
    console.log('❌ WebSocket 클라이언트 연결 종료');
    clearInterval(pingInterval);
    clients.delete(ws);
  });

  // 에러 처리
  ws.on('error', (error) => {
    console.error('WebSocket 에러:', error);
    clearInterval(pingInterval);
    clients.delete(ws);
  });
});

// 대기열 업데이트 브로드캐스트 함수
const broadcastQueueUpdate = (queueData) => {
  const message = JSON.stringify({
    type: 'QUEUE_UPDATE',
    queue: queueData
  });

  clients.forEach((client) => {
    if (client.readyState === 1) { // WebSocket.OPEN = 1
      client.send(message);
    }
  });
};

// 환자 호출 브로드캐스트 함수
const broadcastPatientCalled = (patientData) => {
  const message = JSON.stringify({
    type: 'PATIENT_CALLED',
    patient: patientData
  });

  clients.forEach((client) => {
    if (client.readyState === 1) { // WebSocket.OPEN = 1
      client.send(message);
    }
  });
};

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`✅ WebSocket 서버가 ws://localhost:${PORT}/ws 에서 실행 중입니다.`);
});

// 브로드캐스트 함수들을 외부에서 사용할 수 있도록 export
module.exports = {
  broadcastQueueUpdate,
  broadcastPatientCalled
};

