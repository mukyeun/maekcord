import React, { useState, useEffect } from 'react';
import { Badge, Tooltip, Button } from 'antd';
import { 
  WifiOutlined, 
  DisconnectOutlined, 
  SyncOutlined, 
  ExclamationCircleOutlined,
  ReloadOutlined 
} from '@ant-design/icons';
import { wsClient } from '../../utils/websocket';
import styled from 'styled-components';

const StatusContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-radius: 6px;
  background: ${({ status }) => {
    switch (status) {
      case 'connected': return '#f6ffed';
      case 'connecting': return '#fff7e6';
      case 'reconnecting': return '#fff7e6';
      case 'disconnected': return '#fff2f0';
      case 'error': return '#fff2f0';
      case 'failed': return '#fff2f0';
      default: return '#f5f5f5';
    }
  }};
  border: 1px solid ${({ status }) => {
    switch (status) {
      case 'connected': return '#b7eb8f';
      case 'connecting': return '#ffd591';
      case 'reconnecting': return '#ffd591';
      case 'disconnected': return '#ffccc7';
      case 'error': return '#ffccc7';
      case 'failed': return '#ffccc7';
      default: return '#d9d9d9';
    }
  }};
  transition: all 0.3s ease;
`;

const StatusText = styled.span`
  font-size: 12px;
  font-weight: 500;
  color: ${({ status }) => {
    switch (status) {
      case 'connected': return '#52c41a';
      case 'connecting': return '#fa8c16';
      case 'reconnecting': return '#fa8c16';
      case 'disconnected': return '#ff4d4f';
      case 'error': return '#ff4d4f';
      case 'failed': return '#ff4d4f';
      default: return '#8c8c8c';
    }
  }};
`;

const WebSocketStatus = ({ showDetails = false, compact = false }) => {
  const [status, setStatus] = useState('disconnected');
  const [connectionInfo, setConnectionInfo] = useState({});

  useEffect(() => {
    // 초기 상태 설정
    setStatus(wsClient.getConnectionStatus());
    setConnectionInfo(wsClient.getConnectionInfo());

    // 상태 변경 리스너 등록
    const removeStatusListener = wsClient.addStatusListener((newStatus) => {
      setStatus(newStatus);
      setConnectionInfo(wsClient.getConnectionInfo());
    });

    return () => {
      removeStatusListener();
    };
  }, []);

  const getStatusIcon = () => {
    switch (status) {
      case 'connected':
        return <WifiOutlined style={{ color: '#52c41a' }} />;
      case 'connecting':
      case 'reconnecting':
        return <SyncOutlined spin style={{ color: '#fa8c16' }} />;
      case 'disconnected':
        return <DisconnectOutlined style={{ color: '#ff4d4f' }} />;
      case 'error':
      case 'failed':
        return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
      default:
        return <DisconnectOutlined style={{ color: '#8c8c8c' }} />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected': return '연결됨';
      case 'connecting': return '연결 중';
      case 'reconnecting': return '재연결 중';
      case 'disconnected': return '연결 끊김';
      case 'error': return '오류';
      case 'failed': return '연결 실패';
      default: return '알 수 없음';
    }
  };

  const handleReconnect = () => {
    wsClient.disconnect();
    setTimeout(() => {
      wsClient.connect();
    }, 1000);
  };

  const getTooltipContent = () => {
    const info = wsClient.getConnectionInfo();
    return (
      <div>
        <div><strong>상태:</strong> {getStatusText()}</div>
        <div><strong>재연결 시도:</strong> {info.reconnectAttempts}회</div>
        <div><strong>메시지 큐:</strong> {info.queueSize}개</div>
        {info.lastPongTime && (
          <div><strong>마지막 응답:</strong> {new Date(info.lastPongTime).toLocaleTimeString()}</div>
        )}
      </div>
    );
  };

  if (compact) {
    return (
      <Tooltip title={getTooltipContent()}>
        <StatusContainer status={status}>
          {getStatusIcon()}
          {!showDetails && <StatusText status={status}>{getStatusText()}</StatusText>}
        </StatusContainer>
      </Tooltip>
    );
  }

  return (
    <Tooltip title={getTooltipContent()}>
      <StatusContainer status={status}>
        {getStatusIcon()}
        <StatusText status={status}>{getStatusText()}</StatusText>
        {showDetails && (
          <>
            {connectionInfo.reconnectAttempts > 0 && (
              <Badge count={connectionInfo.reconnectAttempts} size="small" />
            )}
            {connectionInfo.queueSize > 0 && (
              <Badge count={connectionInfo.queueSize} size="small" style={{ backgroundColor: '#fa8c16' }} />
            )}
          </>
        )}
        {status === 'failed' && (
          <Button 
            type="text" 
            size="small" 
            icon={<ReloadOutlined />} 
            onClick={handleReconnect}
            style={{ padding: 0, height: 'auto' }}
          />
        )}
      </StatusContainer>
    </Tooltip>
  );
};

export default WebSocketStatus; 