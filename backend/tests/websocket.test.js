const { expect } = require('chai');
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const config = require('../config');
const WebSocketService = require('../services/websocketService');

describe('WebSocket Service Tests', () => {
  const testUserId = '123456789';
  const testRoles = ['user', 'admin'];
  const testToken = jwt.sign({ _id: testUserId, roles: testRoles }, config.jwt.secret);
  let wss;
  let ws;
  let server;

  before(() => {
    // WebSocket 서버 시작
    server = require('http').createServer();
    WebSocketService.initialize(server);
    server.listen(0); // 랜덤 포트
    wss = WebSocketService.wss;
  });

  after((done) => {
    server.close(() => {
      WebSocketService.clients.clear();
      WebSocketService.connectionAttempts.clear();
      WebSocketService.heartbeats.clear();
      WebSocketService.userRoles.clear();
      done();
    });
  });

  afterEach(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close();
    }
  });

  describe('Connection and Authentication', () => {
    it('should enforce connection time limit', (done) => {
      ws = new WebSocket(`ws://localhost:${wss.address().port}`);
      
      setTimeout(() => {
        expect(ws.readyState).to.equal(WebSocket.CLOSED);
        done();
      }, 6000);
    });

    it('should authenticate with valid token', (done) => {
      ws = new WebSocket(`ws://localhost:${wss.address().port}`);
      
      ws.on('open', () => {
        ws.send(JSON.stringify({
          type: 'auth',
          token: testToken
        }));
      });

      ws.on('message', (data) => {
        const message = JSON.parse(data);
        if (message.type === 'auth_success') {
          expect(message.message).to.equal('인증 성공');
          expect(WebSocketService.clients.has(testUserId)).to.be.true;
          expect(WebSocketService.userRoles.get(testUserId)).to.deep.equal(testRoles);
          done();
        }
      });
    });

    it('should reject invalid token', (done) => {
      ws = new WebSocket(`ws://localhost:${wss.address().port}`);
      
      ws.on('open', () => {
        ws.send(JSON.stringify({
          type: 'auth',
          token: 'invalid_token'
        }));
      });

      ws.on('close', (code) => {
        expect(code).to.equal(4007);
        done();
      });
    });

    it('should handle multiple connections from same user', (done) => {
      const ws1 = new WebSocket(`ws://localhost:${wss.address().port}`);
      
      ws1.on('open', () => {
        ws1.send(JSON.stringify({
          type: 'auth',
          token: testToken
        }));
      });

      ws1.on('message', (data) => {
        const message = JSON.parse(data);
        if (message.type === 'auth_success') {
          // 첫 번째 연결 성공 후 두 번째 연결 시도
          const ws2 = new WebSocket(`ws://localhost:${wss.address().port}`);
          
          ws2.on('open', () => {
            ws2.send(JSON.stringify({
              type: 'auth',
              token: testToken
            }));
          });

          ws1.on('close', (code) => {
            expect(code).to.equal(4006);
            ws2.close();
            done();
          });
        }
      });
    });
  });

  describe('Message Handling', () => {
    beforeEach((done) => {
      ws = new WebSocket(`ws://localhost:${wss.address().port}`);
      
      ws.on('open', () => {
        ws.send(JSON.stringify({
          type: 'auth',
          token: testToken
        }));
      });

      ws.on('message', (data) => {
        const message = JSON.parse(data);
        if (message.type === 'auth_success') {
          done();
        }
      });
    });

    it('should handle ping messages', (done) => {
      ws.send(JSON.stringify({ type: 'ping' }));

      ws.on('message', (data) => {
        const message = JSON.parse(data);
        if (message.type === 'pong') {
          done();
        }
      });
    });

    it('should reject unauthorized messages', (done) => {
      const unauthorizedWs = new WebSocket(`ws://localhost:${wss.address().port}`);
      
      unauthorizedWs.on('open', () => {
        unauthorizedWs.send(JSON.stringify({ type: 'ping' }));
      });

      unauthorizedWs.on('close', (code) => {
        expect(code).to.equal(4002);
        done();
      });
    });
  });

  describe('Notification Broadcasting', () => {
    let connectedClients = [];

    beforeEach(async () => {
      // 여러 클라이언트 연결 생성
      const roles = [
        { id: '1', roles: ['doctor'] },
        { id: '2', roles: ['nurse'] },
        { id: '3', roles: ['admin'] }
      ];

      connectedClients = await Promise.all(roles.map(async (user) => {
        const token = jwt.sign({ _id: user.id, roles: user.roles }, config.jwt.secret);
        const client = new WebSocket(`ws://localhost:${wss.address().port}`);
        
        await new Promise((resolve) => {
          client.on('open', () => {
            client.send(JSON.stringify({
              type: 'auth',
              token
            }));
          });

          client.on('message', (data) => {
            const message = JSON.parse(data);
            if (message.type === 'auth_success') {
              resolve();
            }
          });
        });

        return client;
      }));
    });

    afterEach(() => {
      connectedClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.close();
        }
      });
      connectedClients = [];
    });

    it('should broadcast to specific roles', (done) => {
      let messageCount = 0;
      const expectedCount = 2; // doctor와 nurse만 받아야 함

      connectedClients.forEach(client => {
        client.on('message', (data) => {
          const message = JSON.parse(data);
          if (message.type === 'CRITICAL_VITAL_SIGN') {
            messageCount++;
            if (messageCount === expectedCount) {
              done();
            }
          }
        });
      });

      WebSocketService.sendCriticalAlert({
        patientId: '123',
        _id: '456',
        type: 'heartrate',
        value: 150,
        timestamp: new Date(),
        status: 'critical'
      });
    });

    it('should send notification to specific user', (done) => {
      const targetUserId = '1';
      let receivedCount = 0;

      connectedClients.forEach(client => {
        client.on('message', (data) => {
          const message = JSON.parse(data);
          if (message.type === 'notification') {
            receivedCount++;
          }
        });
      });

      WebSocketService.sendNotification(targetUserId, {
        type: 'test',
        message: 'Test notification'
      });

      setTimeout(() => {
        expect(receivedCount).to.equal(1);
        done();
      }, 100);
    });
  });

  describe('Connection Limits', () => {
    const createConnections = async (count) => {
      const connections = [];
      for (let i = 0; i < count; i++) {
        const ws = new WebSocket(`ws://localhost:${wss.address().port}`);
        connections.push(ws);
        await new Promise(resolve => ws.on('open', resolve));
      }
      return connections;
    };

    afterEach(() => {
      WebSocketService.connectionAttempts.clear();
    });

    it('should enforce connection limits per IP', async () => {
      const connections = await createConnections(WebSocketService.MAX_CONNECTIONS_PER_IP);
      
      // 추가 연결 시도
      const extraWs = new WebSocket(`ws://localhost:${wss.address().port}`);
      
      await new Promise((resolve) => {
        extraWs.on('error', () => {
          connections.forEach(ws => ws.close());
          resolve();
        });
      });

      expect(WebSocketService.connectionAttempts.size).to.be.above(0);
    });
  });
}); 