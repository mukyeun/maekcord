import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Socket.IO 클라이언트 초기화
    const socketInstance = io('http://localhost:5000', {
      transports: ['websocket'],
      autoConnect: true
    });

    // 연결 이벤트 핸들러
    socketInstance.on('connect', () => {
      console.log('✅ 웹소켓 서버 연결됨');
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ 웹소켓 서버 연결 끊김');
    });

    socketInstance.on('error', (error) => {
      console.error('웹소켓 에러:', error);
    });

    setSocket(socketInstance);

    // 컴포넌트 언마운트 시 소켓 연결 해제
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, []);

  // 소켓 인스턴스를 사용하기 쉽게 래핑
  const socketWrapper = {
    on: (event, callback) => {
      if (socket) socket.on(event, callback);
    },
    off: (event, callback) => {
      if (socket) socket.off(event, callback);
    },
    emit: (event, data) => {
      if (socket) socket.emit(event, data);
    }
  };

  return (
    <SocketContext.Provider value={socketWrapper}>
      {children}
    </SocketContext.Provider>
  );
};

// 커스텀 훅
export const useSocket = () => {
  const socket = useContext(SocketContext);
  if (!socket) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return socket;
}; 