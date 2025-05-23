import styled, { keyframes, css } from 'styled-components';
import { List } from 'antd';

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

export const Container = styled.div`
  ${css`
    padding: 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  `}
`;

export const QueueItem = styled.div`
  ${css`
    display: flex;
    align-items: center;
    padding: 12px;
    margin: 8px 0;
    border: 1px solid #f0f0f0;
    border-radius: 4px;
    transition: all 0.3s ease;

    &:hover {
      background: #fafafa;
    }
  `}
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

export const CallStatus = styled.div`
  ${({ $status }) => {
    switch ($status) {
      case 'waiting':
        return css`
          padding: 4px 12px;
          border-radius: 16px;
          font-size: 14px;
          font-weight: 500;
          background: #fff7e6;
          color: #fa8c16;
          border: 1px solid #ffd591;
        `;
      case 'called':
        return css`
          padding: 4px 12px;
          border-radius: 16px;
          font-size: 14px;
          font-weight: 500;
          background: #f6ffed;
          color: #52c41a;
          border: 1px solid #b7eb8f;
          animation: ${pulse} 2s infinite;
        `;
      case 'consulting':
        return css`
          padding: 4px 12px;
          border-radius: 16px;
          font-size: 14px;
          font-weight: 500;
          background: #e6f7ff;
          color: #1890ff;
          border: 1px solid #91d5ff;
        `;
      default:
        return css`
          padding: 4px 12px;
          border-radius: 16px;
          font-size: 14px;
          font-weight: 500;
          background: #f5f5f5;
          color: #8c8c8c;
          border: 1px solid #d9d9d9;
        `;
    }
  }}
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

  @media (max-width: 576px) {
    grid-template-columns: 1fr;
  }
`;

export const QueueCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: ${({ status }) => status === 'called' ? '#e6f7ff' : 'white'};
  border: 1px solid ${({ status }) => status === 'called' ? '#91d5ff' : '#d9d9d9'};
  border-radius: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

export const QueueNumberText = styled.div`
  font-size: 24px;
  font-weight: bold;
  color: #1890ff;
  min-width: 80px;
`;

export const PatientNameText = styled.div`
  font-size: 18px;
  color: rgba(0, 0, 0, 0.85);
  flex: 1;
  text-align: center;
`;

export const FullscreenButton = styled.button`
  all: unset;
  cursor: pointer;
  background: #1890ff;
  color: white;
  padding: 10px 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
  &:hover {
    background: #40a9ff;
  }
`;