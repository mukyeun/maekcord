class WebSocketClient {
  constructor() {
    this.ws = null;
    this.listeners = [];
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000; // 1초
    this.maxReconnectDelay = 30000; // 30초
    this.pingInterval = null;
    this.pongTimeout = null;
    this.messageQueue = [];
    this.isConnecting = false;
    this.connectionStatus = 'disconnected'; // disconnected, connecting, connected, reconnecting
    this.serverUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:5000';
    this.lastPongTime = null;
    this.heartbeatInterval = 30000; // 30초
    this.pongTimeoutDuration = 10000; // 10초
  }

  getConnectionStatus() {
    return this.connectionStatus;
  }

  isConnected() {
    return this.connectionStatus === 'connected' && this.ws?.readyState === WebSocket.OPEN;
  }

  connect() {
    if (this.isConnecting || this.isConnected()) {
      console.log('🔌 WebSocket 연결 중이거나 이미 연결되어 있습니다.');
      return;
    }

    this.isConnecting = true;
    this.connectionStatus = 'connecting';

    try {
      console.log('🔄 WebSocket 연결 시도...');
      this.ws = new WebSocket(this.serverUrl);

      this.ws.onopen = () => {
        console.log('✅ WebSocket 연결 성공');
        this.connectionStatus = 'connected';
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.lastPongTime = Date.now();
        this.startHeartbeat();
        this.processMessageQueue();
        this.notifyStatusChange('connected');
      };

      this.ws.onclose = (event) => {
        console.log('❌ WebSocket 연결 종료:', event.code, event.reason);
        this.connectionStatus = 'disconnected';
        this.isConnecting = false;
        this.stopHeartbeat();
        this.notifyStatusChange('disconnected');
        
        // 정상적인 종료가 아닌 경우에만 재연결 시도
        if (event.code !== 1000) {
          this.reconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket 오류:', error);
        this.connectionStatus = 'error';
        this.isConnecting = false;
        this.notifyStatusChange('error');
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 WebSocket 메시지 수신:', data);
          
          // PONG 메시지 처리
          if (data.type === 'PONG') {
            this.handlePong();
            return;
          }
          
          this.notifyListeners(data);
        } catch (error) {
          console.error('❌ WebSocket 메시지 파싱 오류:', error);
        }
      };
    } catch (error) {
      console.error('❌ WebSocket 연결 실패:', error);
      this.connectionStatus = 'error';
      this.isConnecting = false;
      this.notifyStatusChange('error');
      this.reconnect();
    }
  }

  reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ 최대 재연결 시도 횟수 초과');
      this.connectionStatus = 'failed';
      this.notifyStatusChange('failed');
      return;
    }

    this.reconnectAttempts++;
    this.connectionStatus = 'reconnecting';
    this.notifyStatusChange('reconnecting');
    
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.maxReconnectDelay
    );
    
    console.log(`🔄 ${delay}ms 후 재연결 시도 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  startHeartbeat() {
    this.stopHeartbeat();
    
    this.pingInterval = setInterval(() => {
      if (this.isConnected()) {
        this.send({ type: 'PING' });
        
        // PONG 응답 대기
        this.pongTimeout = setTimeout(() => {
          console.warn('⚠️ PONG 응답 시간 초과, 연결 재시도');
          this.ws?.close();
        }, this.pongTimeoutDuration);
      }
    }, this.heartbeatInterval);
  }

  stopHeartbeat() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.pongTimeout) {
      clearTimeout(this.pongTimeout);
      this.pongTimeout = null;
    }
  }

  handlePong() {
    this.lastPongTime = Date.now();
    if (this.pongTimeout) {
      clearTimeout(this.pongTimeout);
      this.pongTimeout = null;
    }
  }

  disconnect() {
    console.log('🔌 WebSocket 연결 종료 요청');
    this.connectionStatus = 'disconnected';
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    this.stopHeartbeat();
    this.messageQueue = [];
    this.notifyStatusChange('disconnected');
  }

  send(data) {
    if (this.isConnected()) {
      try {
        const message = typeof data === 'string' ? data : JSON.stringify(data);
        this.ws.send(message);
        console.log('📤 WebSocket 메시지 전송:', data);
      } catch (error) {
        console.error('❌ WebSocket 메시지 전송 실패:', error);
        this.queueMessage(data);
      }
    } else {
      console.warn('⚠️ WebSocket이 연결되어 있지 않습니다. 메시지를 큐에 추가합니다.');
      this.queueMessage(data);
    }
  }

  queueMessage(data) {
    // 중요하지 않은 메시지는 큐에 추가하지 않음
    if (data.type && ['PING', 'PONG'].includes(data.type)) {
      return;
    }
    
    this.messageQueue.push({
      data,
      timestamp: Date.now()
    });
    
    // 큐 크기 제한 (최대 50개)
    if (this.messageQueue.length > 50) {
      this.messageQueue.shift();
    }
  }

  processMessageQueue() {
    if (this.messageQueue.length === 0) return;
    
    console.log(`📤 큐에 있는 ${this.messageQueue.length}개 메시지 전송`);
    
    while (this.messageQueue.length > 0) {
      const { data } = this.messageQueue.shift();
      this.send(data);
    }
  }

  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  addStatusListener(callback) {
    this.statusListeners = this.statusListeners || [];
    this.statusListeners.push(callback);
    return () => {
      this.statusListeners = this.statusListeners.filter(listener => listener !== callback);
    };
  }

  notifyListeners(data) {
    this.listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error('❌ WebSocket 리스너 실행 오류:', error);
      }
    });
  }

  notifyStatusChange(status) {
    if (this.statusListeners) {
      this.statusListeners.forEach(listener => {
        try {
          listener(status);
        } catch (error) {
          console.error('❌ WebSocket 상태 리스너 실행 오류:', error);
        }
      });
    }
  }

  // 연결 상태 정보 반환
  getConnectionInfo() {
    return {
      status: this.connectionStatus,
      isConnected: this.isConnected(),
      reconnectAttempts: this.reconnectAttempts,
      lastPongTime: this.lastPongTime,
      queueSize: this.messageQueue.length
    };
  }
}

export const wsClient = new WebSocketClient(); 