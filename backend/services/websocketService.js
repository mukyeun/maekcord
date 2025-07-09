const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../utils/logger');

class WebSocketService {
  constructor() {
    this.wss = null;
    this.clients = new Map(); // userId -> WebSocket
    this.connectionAttempts = new Map(); // IP -> {count, timestamp}
    this.heartbeats = new Map(); // userId -> lastHeartbeat
    this.userRoles = new Map(); // userId -> roles[]
    this.MAX_CONNECTIONS_PER_IP = 50;
    this.CONNECTION_WINDOW = 60000; // 1분
    this.HEARTBEAT_INTERVAL = 30000; // 30초
    this.HEARTBEAT_TIMEOUT = 60000; // 1분
  }

  startHeartbeat() {
    setInterval(() => {
      const now = Date.now();
      this.clients.forEach((ws, userId) => {
        const lastHeartbeat = this.heartbeats.get(userId);
        if (now - lastHeartbeat > this.HEARTBEAT_TIMEOUT) {
          logger.websocket('Heartbeat timeout, closing connection', { userId });
          ws.close(4000, 'Heartbeat timeout');
          this.clients.delete(userId);
          this.heartbeats.delete(userId);
          this.userRoles.delete(userId);
        } else {
          ws.ping();
        }
      });
    }, this.HEARTBEAT_INTERVAL);
  }

  initialize(server) {
    this.wss = new WebSocket.Server({ 
      server,
      verifyClient: (info, callback) => {
        const ip = info.req.socket.remoteAddress;
        if (!this.checkConnectionLimit(ip)) {
          logger.security('Connection limit exceeded', { ip });
          callback(false, 429, 'Too Many Connections');
          return;
        }
        callback(true);
      }
    });
    
    this.startHeartbeat();
    
    this.wss.on('connection', (ws, req) => {
      const ip = req.socket.remoteAddress;
      logger.websocket('New connection', { ip });
      
      let authTimeout = setTimeout(() => {
        if (!ws.userId) {
          ws.close(4001, 'Authentication timeout');
          logger.security('Authentication timeout', { ip });
        }
      }, 5000);

      ws.isAlive = true;
      
      ws.on('pong', () => {
        ws.isAlive = true;
        if (ws.userId) {
          this.heartbeats.set(ws.userId, Date.now());
        }
      });
      
      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message);
          
          if (data.type === 'auth') {
            await this.handleAuth(ws, data.token, ip);
            clearTimeout(authTimeout);
          } else if (!ws.userId) {
            ws.close(4002, 'Unauthorized');
            logger.security('Unauthorized message', { ip });
          } else {
            // 추가 메시지 처리
            this.handleMessage(ws.userId, data);
          }
        } catch (error) {
          logger.error('Message handling error', { error: error.message, ip });
          ws.close(4003, 'Message handling error');
        }
      });

      ws.on('close', () => {
        if (ws.userId) {
          this.clients.delete(ws.userId);
          this.heartbeats.delete(ws.userId);
          this.userRoles.delete(ws.userId);
          logger.websocket('Connection closed', { userId: ws.userId, ip });
        }
      });

      ws.on('error', (error) => {
        logger.error('WebSocket error', { error: error.message, ip });
        ws.close(4004, 'Connection error');
      });
    });

    logger.info('WebSocket server initialized');
  }

  async handleAuth(ws, token, ip) {
    if (!token) {
      ws.close(4005, 'Missing token');
      logger.security('Missing authentication token', { ip });
      return;
    }

    try {
      const decoded = await jwt.verify(token, config.jwt.secret);
      
      // 기존 연결 확인
      const existingWs = this.clients.get(decoded._id);
      if (existingWs) {
        existingWs.close(4006, 'New connection established');
        logger.websocket('Closing existing connection', { userId: decoded._id });
      }

      // 새 연결 등록
      ws.userId = decoded._id;
      this.clients.set(decoded._id, ws);
      this.heartbeats.set(decoded._id, Date.now());
      
      // 사용자 역할 저장
      if (decoded.roles) {
        this.userRoles.set(decoded._id, decoded.roles);
      }

      ws.send(JSON.stringify({
        type: 'auth_success',
        message: '인증 성공'
      }));

      logger.websocket('Authentication successful', { 
        userId: decoded._id, 
        roles: decoded.roles,
        ip 
      });
    } catch (error) {
      ws.close(4007, 'Invalid token');
      logger.security('Invalid authentication token', { ip, error: error.message });
    }
  }

  handleMessage(userId, data) {
    switch (data.type) {
      case 'ping':
        this.sendToUser(userId, { type: 'pong' });
        break;
      // 추가 메시지 타입 처리
      default:
        logger.debug('Unhandled message type', { userId, type: data.type });
    }
  }

  checkConnectionLimit(ip) {
    const now = Date.now();
    const attempts = this.connectionAttempts.get(ip) || { count: 0, timestamp: now };

    if (now - attempts.timestamp > this.CONNECTION_WINDOW) {
      attempts.count = 1;
      attempts.timestamp = now;
    } else if (attempts.count >= this.MAX_CONNECTIONS_PER_IP) {
      return false;
    } else {
      attempts.count += 1;
    }

    this.connectionAttempts.set(ip, attempts);
    return true;
  }

  // 특정 사용자에게 메시지 전송
  sendToUser(userId, data) {
    const client = this.clients.get(userId);
    if (client && client.readyState === WebSocket.OPEN) {
      try {
        client.send(JSON.stringify({
          ...data,
          timestamp: new Date().toISOString()
        }));
        return true;
      } catch (error) {
        logger.error('Error sending to user', { userId, error: error.message });
        client.close(4008, 'Send error');
        return false;
      }
    }
    return false;
  }

  // 특정 역할의 모든 사용자에게 메시지 전송
  broadcastToRole(roles, data) {
    let sent = 0;
    this.clients.forEach((client, userId) => {
      const userRoles = this.userRoles.get(userId);
      if (client.readyState === WebSocket.OPEN && 
          userRoles && 
          roles.some(role => userRoles.includes(role))) {
        try {
          client.send(JSON.stringify({
            ...data,
            timestamp: new Date().toISOString()
          }));
          sent++;
        } catch (error) {
          logger.error('Broadcast to role error', { userId, error: error.message });
          client.close(4009, 'Broadcast error');
        }
      }
    });
    logger.websocket('Broadcast to roles sent', { roles, recipients: sent });
    return sent;
  }

  // 알림 전송
  sendNotification(userId, notification) {
    return this.sendToUser(userId, {
      type: 'notification',
      data: notification
    });
  }

  // 전체 알림 브로드캐스트
  broadcastNotification(notification) {
    let sent = 0;
    this.clients.forEach((client, userId) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(JSON.stringify({
            type: 'notification',
            data: notification,
            timestamp: new Date().toISOString()
          }));
          sent++;
        } catch (error) {
          logger.error('Broadcast error', { userId, error: error.message });
          client.close(4009, 'Broadcast error');
        }
      }
    });
    logger.websocket('Broadcast notification sent', { recipients: sent });
    return sent;
  }

  // 위험 상태 알림 전송
  sendCriticalAlert(vitalSign) {
    const alertData = {
      type: 'CRITICAL_VITAL_SIGN',
      data: {
        patientId: vitalSign.patientId,
        vitalSignId: vitalSign._id,
        vitalSignType: vitalSign.type,
        value: vitalSign.value,
        timestamp: vitalSign.timestamp,
        status: vitalSign.status
      }
    };

    return this.broadcastToRole(['doctor', 'nurse'], alertData);
  }
}

module.exports = new WebSocketService(); 