const WebSocket = require('ws');
const Queue = require('../models/Queue');
const Patient = require('../models/Patient');
const logger = require('../utils/logger');

class WebSocketServer {
  constructor() {
    this.wss = null;
    this.clients = new Set();
    this.heartbeatInterval = null;
  }

  init(server) {
    this.wss = new WebSocket.Server({ 
      server,
      path: '/',
      perMessageDeflate: false
    });

    this.wss.on('connection', (ws, req) => {
      logger.info('🔌 새로운 WebSocket 연결', {
        ip: req.socket.remoteAddress,
        url: req.url
      });

      this.clients.add(ws);
      ws.isAlive = true;

      ws.on('pong', () => {
        ws.isAlive = true;
      });

      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message);
          logger.info('📨 WebSocket 메시지 수신:', data);

          switch (data.type) {
            case 'PING':
              ws.send(JSON.stringify({ type: 'PONG' }));
              break;

            case 'PATIENT_CALLED':
              await this.handlePatientCalled(data);
              break;
            
            case 'PATIENT_CALLED_TO_DOCTOR':
              await this.handlePatientCalledToDoctor(data);
              break;
            
            case 'CONSULTATION_STARTED':
              await this.handleConsultationStarted(data);
              break;
            
            case 'CONSULTATION_COMPLETED':
              await this.handleConsultationCompleted(data);
              break;
            
            default:
              logger.warn('⚠️ 처리되지 않은 메시지 타입:', data.type);
          }
        } catch (error) {
          logger.error('❌ WebSocket 메시지 처리 오류:', error);
          ws.send(JSON.stringify({
            type: 'ERROR',
            message: '메시지 처리 중 오류가 발생했습니다.'
          }));
        }
      });

      ws.on('error', (error) => {
        logger.error('❌ WebSocket 에러:', error);
        this.clients.delete(ws);
      });

      ws.on('close', (code, reason) => {
        logger.info('🔌 WebSocket 연결 종료', {
          code,
          reason: reason.toString()
        });
        this.clients.delete(ws);
      });

      // 초기 연결 시 현재 대기 목록 전송
      this.sendInitialData(ws).catch(error => {
        logger.error('❌ 초기 데이터 전송 실패:', error);
      });
    });

    // 주기적으로 연결 상태 확인
    this.startHeartbeat();

    this.wss.on('close', () => {
      this.stopHeartbeat();
    });
  }

  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
          logger.warn('⚠️ 응답 없는 클라이언트 연결 종료');
          return ws.terminate();
        }

        ws.isAlive = false;
        ws.ping();
      });
    }, 15000);
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  async sendInitialData(ws) {
    try {
      const queues = await Queue.find()
        .populate('patientId')
        .sort({ createdAt: -1 })
        .lean();

      const formattedQueues = queues.map(queue => ({
        _id: queue._id,
        patientId: queue.patientId,
        status: queue.status,
        queueNumber: queue.queueNumber,
        sequenceNumber: queue.sequenceNumber,
        createdAt: queue.createdAt,
        updatedAt: queue.updatedAt
      }));

      ws.send(JSON.stringify({
        type: 'QUEUE_UPDATE',
        queue: formattedQueues
      }));

      logger.info('✅ 초기 큐 데이터 전송 완료:', {
        count: formattedQueues.length
      });
    } catch (error) {
      logger.error('❌ 초기 큐 데이터 전송 실패:', error);
      throw error;
    }
  }

  // 환자 호출 처리
  async handlePatientCalled(data) {
    try {
      const { patientId, queueId, status } = data;
      
      // 큐 상태 업데이트
      const updatedQueue = await Queue.findByIdAndUpdate(
        queueId,
        { status },
        { new: true }
      ).populate('patientId');

      if (!updatedQueue) {
        throw new Error('큐를 찾을 수 없습니다.');
      }

      // 모든 클라이언트에게 업데이트된 큐 목록 전송
      const queues = await Queue.find()
        .populate('patientId')
        .sort({ createdAt: -1 })
        .lean();

      const formattedQueues = queues.map(queue => ({
        _id: queue._id,
        patientId: queue.patientId,
        status: queue.status,
        queueNumber: queue.queueNumber,
        sequenceNumber: queue.sequenceNumber,
        createdAt: queue.createdAt,
        updatedAt: queue.updatedAt
      }));

      this.broadcast({
        type: 'PATIENT_CALLED',
        patient: updatedQueue.patientId,
        queueId: updatedQueue._id,
        status: updatedQueue.status,
        queue: formattedQueues,
        timestamp: new Date().toISOString()
      });

      logger.info('✅ 환자 호출 처리 완료:', {
        patientId,
        queueId,
        status
      });
    } catch (error) {
      logger.error('❌ 환자 호출 처리 실패:', error);
      throw error;
    }
  }

  // 접수실에서 진료실로 환자 호출 처리
  async handlePatientCalledToDoctor(data) {
    try {
      const { patient } = data;
      
      logger.info('👨‍⚕️ 진료실로 환자 호출:', {
        patientId: patient.patientId?._id,
        patientName: patient.patientId?.basicInfo?.name,
        queueId: patient._id
      });

      // 진료실 클라이언트들에게만 전송
      this.broadcast({
        type: 'PATIENT_CALLED_TO_DOCTOR',
        patient: patient,
        timestamp: new Date().toISOString()
      });

      logger.info('✅ 진료실 환자 호출 전송 완료');
    } catch (error) {
      logger.error('❌ 진료실 환자 호출 처리 실패:', error);
      throw error;
    }
  }

  // 진료 시작 처리
  async handleConsultationStarted(data) {
    try {
      const { patientId } = data;
      
      logger.info('🏥 진료 시작:', { patientId });

      // 모든 클라이언트에게 진료 시작 알림
      this.broadcast({
        type: 'CONSULTATION_STARTED',
        patientId: patientId,
        timestamp: new Date().toISOString()
      });

      // 업데이트된 큐 목록도 함께 전송
      const queues = await Queue.find()
        .populate('patientId')
        .sort({ createdAt: -1 })
        .lean();

      const formattedQueues = queues.map(queue => ({
        _id: queue._id,
        patientId: queue.patientId,
        status: queue.status,
        queueNumber: queue.queueNumber,
        sequenceNumber: queue.sequenceNumber,
        createdAt: queue.createdAt,
        updatedAt: queue.updatedAt
      }));

      this.broadcast({
        type: 'QUEUE_UPDATE',
        queue: formattedQueues
      });

      logger.info('✅ 진료 시작 알림 전송 완료');
    } catch (error) {
      logger.error('❌ 진료 시작 처리 실패:', error);
      throw error;
    }
  }

  // 진료 완료 처리
  async handleConsultationCompleted(data) {
    try {
      const { patientId } = data;
      
      logger.info('✅ 진료 완료:', { patientId });

      // 모든 클라이언트에게 진료 완료 알림
      this.broadcast({
        type: 'CONSULTATION_COMPLETED',
        patientId: patientId,
        timestamp: new Date().toISOString()
      });

      // 업데이트된 큐 목록도 함께 전송
      const queues = await Queue.find()
        .populate('patientId')
        .sort({ createdAt: -1 })
        .lean();

      const formattedQueues = queues.map(queue => ({
        _id: queue._id,
        patientId: queue.patientId,
        status: queue.status,
        queueNumber: queue.queueNumber,
        sequenceNumber: queue.sequenceNumber,
        createdAt: queue.createdAt,
        updatedAt: queue.updatedAt
      }));

      this.broadcast({
        type: 'QUEUE_UPDATE',
        queue: formattedQueues
      });

      logger.info('✅ 진료 완료 알림 전송 완료');
    } catch (error) {
      logger.error('❌ 진료 완료 처리 실패:', error);
      throw error;
    }
  }

  // 모든 클라이언트에 메시지 전송
  broadcast(data) {
    const message = JSON.stringify(data);
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
}

module.exports = new WebSocketServer(); 