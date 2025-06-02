const WebSocket = require('ws');
const logger = require('./logger');

let wss = null;

const initWebSocket = (server) => {
  try {
    wss = new WebSocket.Server({ server });
    logger.info('WebSocket 서버 초기화 완료');

    wss.on('connection', (ws) => {
      logger.info('새로운 WebSocket 클라이언트 연결됨');

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          logger.info('WebSocket 메시지 수신:', data);
          
          // 메시지 브로드캐스트
          wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(data));
            }
          });
        } catch (error) {
          logger.error('WebSocket 메시지 처리 실패:', error);
        }
      });

      ws.on('error', (error) => {
        logger.error('WebSocket 클라이언트 에러:', error);
      });

      ws.on('close', () => {
        logger.info('WebSocket 클라이언트 연결 종료');
      });
    });

    wss.on('error', (error) => {
      logger.error('WebSocket 서버 에러:', error);
    });

  } catch (error) {
    logger.error('WebSocket 서버 초기화 실패:', error);
    throw error;
  }
};

const broadcast = (type, data) => {
  if (!wss) {
    logger.warn('WebSocket 서버가 초기화되지 않았습니다.');
    return;
  }

  const message = JSON.stringify({ type, data });
  
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};

// 대기 목록 업데이트 브로드캐스트
const broadcastQueueUpdate = (queueList) => {
  broadcast('queue:updated', queueList);
};

// 환자 호출 브로드캐스트
const broadcastPatientCalled = (patientData) => {
  broadcast('patient:called', patientData);
};

module.exports = {
  initWebSocket,
  broadcastQueueUpdate,
  broadcastPatientCalled,
  broadcast
}; 