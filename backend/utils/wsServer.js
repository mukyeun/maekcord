const WebSocket = require('ws');
const logger = require('./logger');

let wss = null;

const initWebSocket = (server) => {
  wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    logger.info('🔌 새로운 WebSocket 클라이언트 연결');

    ws.isAlive = true;

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        logger.info('📨 WebSocket 메시지 수신:', data);

        // PING 메시지 처리
        if (data.type === 'PING') {
          ws.send(JSON.stringify({ type: 'PONG', timestamp: new Date().toISOString() }));
          return;
        }

        // 다른 메시지 처리
        broadcastMessage(data);
      } catch (error) {
        logger.error('❌ WebSocket 메시지 처리 오류:', error);
      }
    });

    ws.on('error', (error) => {
      logger.error('❌ WebSocket 오류:', error);
    });

    ws.on('close', () => {
      logger.info('🔌 WebSocket 클라이언트 연결 종료');
    });
  });

  // 연결 상태 확인
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        logger.warn('⚠️ 비활성 WebSocket 연결 종료');
        return ws.terminate();
      }

      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  logger.info('✅ WebSocket 서버 초기화 완료');
};

const broadcastMessage = (data) => {
  if (!wss) {
    logger.error('❌ WebSocket 서버가 초기화되지 않았습니다.');
    return;
  }

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(JSON.stringify(data));
      } catch (error) {
        logger.error('❌ WebSocket 메시지 전송 실패:', error);
      }
    }
  });
};

const broadcastQueueUpdate = (queueList) => {
  broadcastMessage({
    type: 'QUEUE_UPDATE',
    queue: queueList,
    timestamp: new Date().toISOString()
  });
};

const broadcastPatientCalled = (data) => {
  broadcastMessage({
    type: 'PATIENT_CALLED',
    ...data,
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  initWebSocket,
  broadcastMessage,
  broadcastQueueUpdate,
  broadcastPatientCalled
}; 