import styled from 'styled-components';
import { List } from 'antd';

export const DisplayContainer = styled.div`
  padding: 20px;
  background: #f0f2f5;
  min-height: 70vh;
`;

export const ControlBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 0 16px;

  .ant-typography {
    margin: 0;
    color: #1890ff;
  }
`;

export const QueueList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  padding: 16px;
`;

export const QueueItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: ${props => props.$isCalled ? '#e6f7ff' : 'white'};
  border: 1px solid ${props => props.$isCalled ? '#91d5ff' : '#d9d9d9'};
  border-radius: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

export const QueueNumber = styled.div`
  font-size: 24px;
  font-weight: bold;
  color: #1890ff;
  min-width: 80px;
`;

export const PatientName = styled.div`
  font-size: 18px;
  color: rgba(0, 0, 0, 0.85);
  flex: 1;
  text-align: center;
`;

export const CallStatus = styled.div`
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 500;
  
  ${props => {
    switch (props.$status) {
      case 'waiting':
        return `
          background: #fff7e6;
          color: #fa8c16;
          border: 1px solid #ffd591;
        `;
      case 'called':
        return `
          background: #f6ffed;
          color: #52c41a;
          border: 1px solid #b7eb8f;
          animation: pulse 2s infinite;
        `;
      case 'consulting':
        return `
          background: #e6f7ff;
          color: #1890ff;
          border: 1px solid #91d5ff;
        `;
      default:
        return `
          background: #f5f5f5;
          color: #8c8c8c;
          border: 1px solid #d9d9d9;
        `;
    }
  }}

  @keyframes pulse {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
    100% {
      transform: scale(1);
    }
  }
`;

export const FullscreenButton = styled.div`
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
`; 