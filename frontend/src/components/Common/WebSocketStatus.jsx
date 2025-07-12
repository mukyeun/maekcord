import React from 'react';
import { Badge, Tooltip } from 'antd';
import { useWebSocket } from '../../hooks/useWebSocket';
import styled from 'styled-components';

const StatusWrapper = styled.div`
  display: inline-flex;
  align-items: center;
  cursor: help;
  margin-right: 16px;
`;

const statusConfig = {
  connected: {
    status: 'success',
    text: '연결됨'
  },
  disconnected: {
    status: 'error',
    text: '연결 끊김'
  },
  connecting: {
    status: 'processing',
    text: '연결 중'
  },
  reconnecting: {
    status: 'warning',
    text: '재연결 중'
  },
  error: {
    status: 'error',
    text: '오류'
  }
};

function WebSocketStatus() {
  const { isConnected, isReady } = useWebSocket();
  
  const status = isReady ? 'connected' : isConnected ? 'connecting' : 'disconnected';
  const config = statusConfig[status];

  return (
    <Tooltip title={`WebSocket 상태: ${config.text}`}>
      <StatusWrapper>
        <Badge status={config.status} text={config.text} />
      </StatusWrapper>
    </Tooltip>
  );
}

export default WebSocketStatus; 