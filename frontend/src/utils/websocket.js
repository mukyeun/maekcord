class WebSocketClient {
  constructor() {
    this.ws = null;
    this.listeners = [];
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // 1초
    this.pingInterval = null;
    this.serverUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:5000';
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('🔌 WebSocket이 이미 연결되어 있습니다.');
      return;
    }

    try {
      console.log('🔄 WebSocket 연결 시도...');
      this.ws = new WebSocket(this.serverUrl);

      this.ws.onopen = () => {
        console.log('✅ WebSocket 연결 성공');
        this.reconnectAttempts = 0;
        this.startPing();
      };

      this.ws.onclose = () => {
        console.log('❌ WebSocket 연결 종료');
        this.stopPing();
        this.reconnect();
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket 오류:', error);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 WebSocket 메시지 수신:', data);
          this.notifyListeners(data);
        } catch (error) {
          console.error('❌ WebSocket 메시지 파싱 오류:', error);
        }
      };
    } catch (error) {
      console.error('❌ WebSocket 연결 실패:', error);
      this.reconnect();
    }
  }

  reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ 최대 재연결 시도 횟수 초과');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`🔄 ${delay}ms 후 재연결 시도 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  startPing() {
    this.stopPing();
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({ type: 'PING' });
      }
    }, 30000); // 30초마다 ping
  }

  stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.stopPing();
  }

  send(data) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        const message = typeof data === 'string' ? data : JSON.stringify(data);
        this.ws.send(message);
        console.log('📤 WebSocket 메시지 전송:', data);
      } catch (error) {
        console.error('❌ WebSocket 메시지 전송 실패:', error);
      }
    } else {
      console.warn('⚠️ WebSocket이 연결되어 있지 않습니다.');
    }
  }

  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
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
}

export const wsClient = new WebSocketClient(); 