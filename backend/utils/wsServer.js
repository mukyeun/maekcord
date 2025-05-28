const WebSocket = require('ws');

let wss;
const clients = new Set();

function initWebSocket(server) {
  wss = new WebSocket.Server({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    console.log('✅ WebSocket 클라이언트 연결됨');
    clients.add(ws);

    // 연결 성공 메시지 전송
    ws.send(JSON.stringify({ 
      type: 'CONNECTED', 
      message: 'WebSocket 연결 성공' 
    }));

    // 클라이언트 메시지 처리
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        console.log('📨 클라이언트 메시지:', data);
        
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
      } catch (error) {
        console.error('메시지 파싱 오류:', error);
      }
    });

    // 연결 종료 처리
    ws.on('close', () => {
      console.log('❌ WebSocket 클라이언트 연결 종료');
      clients.delete(ws);
    });
  });
}

function broadcastQueueUpdate(queue) {
  const message = JSON.stringify({
    type: 'QUEUE_UPDATE',
    queue: queue
  });

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

function broadcastPatientCalled(patient) {
  const message = JSON.stringify({
    type: 'PATIENT_CALLED',
    patient: patient
  });

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

module.exports = {
  initWebSocket,
  broadcastQueueUpdate,
  broadcastPatientCalled
}; 