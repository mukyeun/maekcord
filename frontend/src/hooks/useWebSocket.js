import { useState, useEffect, useCallback, useRef } from 'react';
import webSocketService from '../services/websocket.service';
import { isAuthenticated as checkAuth } from '../utils/auth';
import { notification } from 'antd';

export const useWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [authState, setAuthState] = useState(false);
  const connectionCheckRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const lastConnectAttemptRef = useRef(0);
  const CONNECT_COOLDOWN = 3000; // 3 seconds between connection attempts

  const connect = useCallback(async () => {
    try {
      const now = Date.now();
      if (now - lastConnectAttemptRef.current < CONNECT_COOLDOWN) {
        console.log('연결 시도 제한 시간이 지나지 않았습니다.');
        return;
      }
      lastConnectAttemptRef.current = now;

      // 인증 상태 확인
      const isAuth = checkAuth();
      setAuthState(isAuth);
      
      if (!isAuth) {
        console.warn('WebSocket 연결을 위한 인증이 필요합니다.');
        return;
      }

      // 이미 연결된 상태면 중복 연결 방지
      if (webSocketService.isConnected() && webSocketService.isReady()) {
        setIsConnected(true);
        setIsReady(true);
        return;
      }

      await webSocketService.connect();
      setIsConnected(true);
      
      // 연결 상태가 완전히 준비될 때까지 확인 (최대 3초)
      if (connectionCheckRef.current) {
        clearInterval(connectionCheckRef.current);
      }
      
      let checkCount = 0;
      const MAX_CHECKS = 30; // 3초 (100ms * 30)
      
      connectionCheckRef.current = setInterval(() => {
        checkCount++;
        const ready = webSocketService.isReady();
        setIsReady(ready);
        
        if (ready || checkCount >= MAX_CHECKS) {
          clearInterval(connectionCheckRef.current);
          connectionCheckRef.current = null;
          
          if (!ready && checkCount >= MAX_CHECKS) {
            console.warn('WebSocket 준비 시간 초과');
            disconnect();
          }
        }
      }, 100);

    } catch (error) {
      console.error('WebSocket 연결 실패:', error);
      setIsConnected(false);
      setIsReady(false);

      // 재연결 시도 (3초 후)
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      reconnectTimeoutRef.current = setTimeout(() => {
        if (checkAuth()) {
          console.log('WebSocket 재연결 시도...');
          connect();
        }
      }, CONNECT_COOLDOWN);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (connectionCheckRef.current) {
      clearInterval(connectionCheckRef.current);
      connectionCheckRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    webSocketService.disconnect();
    setIsConnected(false);
    setIsReady(false);
  }, []);

  const send = useCallback(async (event, data) => {
    if (!checkAuth()) {
      throw new Error('WebSocket 메시지 전송을 위한 인증이 필요합니다.');
    }
    
    if (!isReady) {
      // 연결이 끊어진 경우 재연결 시도 (쿨다운 적용)
      const now = Date.now();
      if (now - lastConnectAttemptRef.current >= CONNECT_COOLDOWN) {
        await connect();
        // 재연결 후에도 준비가 안 된 경우
        if (!isReady) {
          throw new Error('WebSocket이 아직 준비되지 않았습니다.');
        }
      } else {
        throw new Error('WebSocket 재연결 시도 중입니다.');
      }
    }
    
    try {
      return await webSocketService.emit(event, data);
    } catch (error) {
      console.error('WebSocket 메시지 전송 실패:', error);
      throw error;
    }
  }, [isReady, connect]);

  const subscribe = useCallback((event, callback) => {
    const wrappedCallback = (...args) => {
      try {
        callback(...args);
      } catch (error) {
        console.error('WebSocket 이벤트 핸들러 오류:', error);
      }
    };
    
    webSocketService.on(event, wrappedCallback);
    return () => webSocketService.off(event, wrappedCallback);
  }, []);

  useEffect(() => {
    // 인증된 상태에서만 연결 시도
    if (checkAuth()) {
      connect();
    }
    
    return () => {
      if (connectionCheckRef.current) {
        clearInterval(connectionCheckRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    isReady,
    isAuthenticated: authState,
    send,
    subscribe,
    connect,
    disconnect
  };
}; 