import config from '../config';
import { getWebSocketToken } from '../utils/auth';
import { notification } from 'antd';

class WebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = config.websocket.reconnectAttempts;
    this.reconnectDelay = config.websocket.reconnectDelay;
    this.heartbeatInterval = null;
    this.listeners = new Map();
    this.lastPongTime = null;
    this.connectionPromise = null;
    this.isConnecting = false;
    this.messageQueue = [];
    this.readyState = WebSocket.CLOSED;
    this.pendingMessages = new Map();
    this.messageIdCounter = 0;
    this.connectionTimeout = null;
    this.connectionEstablished = false;
    this.readyStatePromise = null;
    this.readyStateResolve = null;
    this.initializationQueue = [];
  }

  waitForReadyState() {
    if (this.connectionEstablished && this.readyState === WebSocket.OPEN && this.ws?.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.initializationQueue.push(resolve);
    });
  }

  private_markAsReady() {
    this.connectionEstablished = true;
    this.readyState = WebSocket.OPEN;

    // 초기화 큐에 있는 모든 Promise 해결
    while (this.initializationQueue.length > 0) {
      const resolve = this.initializationQueue.shift();
      resolve();
    }
  }

  private_markAsNotReady() {
    this.connectionEstablished = false;
    this.readyState = WebSocket.CLOSED;
    
    // 초기화 큐 비우기
    this.initializationQueue = [];
  }

  async connect() {
    if (this.connectionEstablished && this.readyState === WebSocket.OPEN && this.ws?.readyState === WebSocket.OPEN) {
      return Promise.resolve(this.ws);
    }

    if (this.isConnecting) {
      return this.connectionPromise;
    }

    // 이전 연결 정리
    this.cleanup();

    this.isConnecting = true;
    this.readyState = WebSocket.CONNECTING;

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        const auth = getWebSocketToken();
        if (!auth || !auth.token) {
          const error = new Error('WebSocket 연결을 위한 인증 정보가 없습니다.');
          this.handleError(error);
          reject(error);
          return;
        }

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws?token=${auth.token}`;

        console.log('WebSocket 연결 시도:', wsUrl);
        this.ws = new WebSocket(wsUrl);
        
        // 연결 타임아웃 설정
        this.connectionTimeout = setTimeout(() => {
          if (!this.connectionEstablished) {
            const error = new Error('WebSocket 연결 시간 초과');
            this.handleError(error);
            reject(error);
          }
        }, config.websocket.timeout || 10000);

        this.setupEventHandlers(resolve, reject);

      } catch (error) {
        this.handleError(error);
        reject(error);
      }
    });

    try {
      await this.connectionPromise;
      
      // 연결이 완전히 설정될 때까지 대기
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 연결 상태 최종 확인
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.private_markAsReady();
        await this.processMessageQueue();
      }
      
      return this.ws;
    } catch (error) {
      console.error('WebSocket 연결 실패:', error);
      notification.error({
        message: 'WebSocket 연결 실패',
        description: error.message
      });
      throw error;
    } finally {
      this.isConnecting = false;
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }
    }
  }

  cleanup() {
    this.private_markAsNotReady();
    
    if (this.ws) {
      // 이전 이벤트 리스너 제거
      this.ws.onopen = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.onmessage = null;
      
      try {
        // 이전 연결 종료
        if (this.ws.readyState === WebSocket.OPEN) {
          this.ws.close(1000, 'New connection initiated');
        }
      } catch (error) {
        console.error('WebSocket 종료 중 오류:', error);
      }
      
      this.ws = null;
    }

    this.stopHeartbeat();
    
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    // 대기 중인 메시지 상태 초기화
    this.pendingMessages.clear();
    this.readyState = WebSocket.CLOSED;
  }

  setupEventHandlers(resolve, reject) {
    if (!this.ws) return;

    let openHandled = false;

    this.ws.onopen = async () => {
      if (openHandled) return;
      openHandled = true;

      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }

      console.log('WebSocket 연결됨');
      
      // 연결 상태 업데이트 전에 약간의 지연을 줌
      await new Promise(resolve => setTimeout(resolve, 100));
      
      this.readyState = WebSocket.OPEN;
      this.reconnectAttempts = 0;
      this.private_markAsReady();
      
      // 하트비트 시작 전에 추가 지연
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.startHeartbeat();
        resolve(this.ws);
      } else {
        reject(new Error('WebSocket connection failed'));
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.id && this.pendingMessages.has(message.id)) {
          const { resolve: msgResolve, reject: msgReject } = this.pendingMessages.get(message.id);
          this.pendingMessages.delete(message.id);
          
          if (message.error) {
            msgReject(new Error(message.error));
          } else {
            msgResolve(message.data);
          }
          return;
        }

        switch (message.type) {
          case 'pong':
            this.lastPongTime = Date.now();
            break;
          case 'notification':
            this.notifyListeners('notification', message.data);
            break;
          default:
            if (message.type) {
              this.notifyListeners(message.type, message.data);
            }
        }
      } catch (error) {
        console.error('메시지 처리 중 오류:', error);
      }
    };

    this.ws.onclose = (event) => {
      const wasConnected = this.connectionEstablished;
      this.cleanup();

      console.log('WebSocket 연결 끊김:', event.code, event.reason);

      if (wasConnected && event.code !== 1000 && event.code !== 1001) {
        this.handleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket 오류:', error);
      this.handleError(error);
      reject(error);
    };
  }

  handleError(error) {
    console.error('WebSocket 오류:', error);
    this.readyState = WebSocket.CLOSED;
    this.cleanup();
    
    notification.error({
      message: 'WebSocket 오류',
      description: error.message || '연결 중 오류가 발생했습니다.'
    });
  }

  handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      notification.error({
        message: 'WebSocket 연결 실패',
        description: '최대 재연결 시도 횟수를 초과했습니다.'
      });
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;

    notification.info({
      message: 'WebSocket 재연결 시도',
      description: `${this.reconnectAttempts}번째 재연결 시도 중...`
    });

    setTimeout(() => {
      if (this.readyState === WebSocket.CLOSED) {
        this.connect().catch(console.error);
      }
    }, delay);
  }

  async processMessageQueue() {
    if (!this.messageQueue.length || !this.connectionEstablished) return;

    console.log(`큐에 있는 메시지 처리 중... (${this.messageQueue.length}개)`);
    
    const messages = [...this.messageQueue];
    this.messageQueue = [];

    for (const { event, data, resolve, reject } of messages) {
      try {
        if (!this.connectionEstablished || this.readyState !== WebSocket.OPEN) {
          throw new Error('WebSocket이 연결되어 있지 않습니다.');
        }
        const result = await this.emit(event, data);
        resolve(result);
      } catch (error) {
        reject(error);
        console.error('메시지 처리 실패:', error);
      }
    }
  }

  startHeartbeat() {
    this.stopHeartbeat();
    this.lastPongTime = Date.now();
    
    this.heartbeatInterval = setInterval(() => {
      if (this.readyState === WebSocket.OPEN) {
        this.emit('ping', { timestamp: Date.now() }).catch(error => {
          console.error('Heartbeat 실패:', error);
          if (this.ws) {
            this.ws.close(3000, 'Heartbeat failed');
          }
        });

        const now = Date.now();
        if (now - this.lastPongTime > config.websocket.heartbeatTimeout) {
          console.warn('Heartbeat 응답 없음, 연결 종료');
          if (this.ws) {
            this.ws.close(3001, 'No heartbeat response');
          }
        }
      }
    }, config.websocket.heartbeatInterval);
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  async emit(event, data) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.connectionEstablished) {
      console.warn('WebSocket이 아직 준비되지 않았습니다. 연결을 시도합니다...');
      
      try {
        await this.connect();
        // 연결 후 추가 지연
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        throw new Error('WebSocket 연결 실패: ' + error.message);
      }
      
      // 연결 후에도 상태 재확인
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.connectionEstablished) {
        throw new Error('WebSocket 연결이 준비되지 않았습니다.');
      }
    }

    return new Promise((resolve, reject) => {
      try {
        const messageId = ++this.messageIdCounter;
        const message = {
          id: messageId,
          type: event,
          data: data,
          timestamp: new Date().toISOString()
        };

        // 메시지 전송 전 최종 상태 확인
        if (this.ws.readyState !== WebSocket.OPEN) {
          throw new Error('WebSocket이 열려있지 않습니다.');
        }

        this.pendingMessages.set(messageId, { resolve, reject });
        
        // 타임아웃 설정
        const timeoutId = setTimeout(() => {
          if (this.pendingMessages.has(messageId)) {
            this.pendingMessages.delete(messageId);
            reject(new Error('메시지 전송 시간 초과'));
          }
        }, 5000);

        this.ws.send(JSON.stringify(message));
        
        console.log(`WebSocket 메시지 전송 (${event}):`, message);
      } catch (error) {
        console.error('메시지 전송 실패:', error);
        reject(error);
      }
    });
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('리스너 실행 중 오류:', error);
        }
      });
    }
  }

  disconnect() {
    this.cleanup();
    this.messageQueue = [];
    this.listeners.clear();
  }

  isConnected() {
    return this.connectionEstablished && this.readyState === WebSocket.OPEN && this.ws?.readyState === WebSocket.OPEN;
  }

  isReady() {
    return this.connectionEstablished && !this.isConnecting && this.isConnected();
  }
}

export default new WebSocketService(); 