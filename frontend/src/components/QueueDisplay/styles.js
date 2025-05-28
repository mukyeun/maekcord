import styled, { css } from 'styled-components';
import { List, Card, Badge } from 'antd';

// 애니메이션 정의
const justCalledAnimation = css`
  @keyframes justCalled {
    0% { background-color: #e6f7ff; }
    50% { background-color: #bae7ff; }
    100% { background-color: #e6f7ff; }
  }
`;

export const Container = styled.div`
  padding: 20px;
  background: #fff;
`;

export const QueueItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const QueueNumber = styled.div`
  ${css`
    font-size: 16px;
    font-weight: 600;
    min-width: 60px;
  `}
`;

export const PatientInfo = styled.div`
  ${css`
    flex: 1;
    margin: 0 12px;
  `}
`;

export const PatientName = styled.div`
  ${css`
    font-size: 16px;
    font-weight: 500;
  `}
`;

export const VisitType = styled.span`
  ${css`
    font-size: 12px;
    color: #8c8c8c;
    margin-left: 8px;
  `}
`;

export const CallStatus = styled.span`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 14px;
  color: ${props => {
    switch (props.$status) {
      case 'waiting': return '#d4b106';
      case 'called': return '#389e0d';
      case 'consulting': return '#096dd9';
      case 'done': return '#8c8c8c';
      default: return '#8c8c8c';
    }
  }};
  background: ${props => {
    switch (props.$status) {
      case 'waiting': return '#fffbe6';
      case 'called': return '#f6ffed';
      case 'consulting': return '#e6f7ff';
      case 'done': return '#f5f5f5';
      default: return '#f5f5f5';
    }
  }};
`;

export const ActionButton = styled.button`
  ${css`
    margin-left: 8px;
    padding: 4px 12px;
    border: 1px solid #d9d9d9;
    border-radius: 4px;
    background: white;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background: #fafafa;
      border-color: #40a9ff;
      color: #40a9ff;
    }
  `}
`;

export const ControlBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

export const QueueList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const QueueCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: ${props => props.$isCalled ? '#e6f7ff' : '#fff'};
  border: 1px solid ${props => props.$isCalled ? '#91d5ff' : '#d9d9d9'};
  border-radius: 8px;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }
`;

export const QueueNumberText = styled.div`
  font-size: 24px;
  font-weight: bold;
  color: #1890ff;
  min-width: 80px;
`;

export const PatientNameText = styled.span`
  font-size: 16px;
  font-weight: 500;
  color: #262626;
`;

export const FullscreenButton = styled.button`
  border: none;
  background: none;
  cursor: pointer;
  font-size: 20px;
  color: #8c8c8c;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.3s ease;

  &:hover {
    color: #1890ff;
  }
`;

export const StyledCard = styled(Card)`
  margin-bottom: 16px;
  transition: transform 0.3s;

  ${({ isJustCalled }) =>
    isJustCalled &&
    css`
      animation: justCalled 1.5s ease-in-out;
      ${justCalledAnimation}
    `}
`;

export const StatusBadge = styled.div`
  font-weight: bold;
  padding: 4px 8px;
  border-radius: 4px;
  background-color: ${({ status }) => {
    switch (status) {
      case 'green': return '#d9f7be';
      case 'blue': return '#adc6ff';
      case 'gold': return '#fff566';
      default: return '#f0f0f0';
    }
  }};
`;

export const WaitingTime = styled.span`
  font-size: 12px;
  color: #888;
`;

export const QueueContainer = styled.div`
  max-height: 500px;
  overflow-y: auto;
`;