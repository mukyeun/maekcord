import styled from 'styled-components';
import { Table, Card, Button } from 'antd';

export const DashboardWrapper = styled.div`
  background: #f0f2f5;
  min-height: 100%;
`;

export const StyledTable = styled(Table)`
  .ant-table {
    background: white;
    border-radius: 8px;
  }

  .ant-table-thead > tr > th {
    background: #fafafa;
    font-weight: 600;
  }

  .ant-table-row {
    cursor: pointer;
  }

  .waiting-row { background: #fff7e6; }
  .called-row { background: #e6f7ff; }
  .consulting-row { background: #f6ffed; }
  .completed-row { background: #f5f5f5; }
`;

export const StatusBadge = styled.span`
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  background: ${props => {
    switch(props.className) {
      case 'waiting': return '#fff7e6';
      case 'called': return '#e6f7ff';
      case 'consulting': return '#f6ffed';
      case 'completed': return '#f5f5f5';
      default: return '#fff7e6';
    }
  }};
  color: ${props => {
    switch(props.className) {
      case 'waiting': return '#fa8c16';
      case 'called': return '#1890ff';
      case 'consulting': return '#52c41a';
      case 'completed': return '#8c8c8c';
      default: return '#fa8c16';
    }
  }};
  border: 1px solid ${props => {
    switch(props.className) {
      case 'waiting': return '#ffd591';
      case 'called': return '#91d5ff';
      case 'consulting': return '#b7eb8f';
      case 'completed': return '#d9d9d9';
      default: return '#ffd591';
    }
  }};
`;

export const DetailCard = styled(Card)`
  margin-bottom: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  .ant-card-head {
    border-bottom: 1px solid #f0f0f0;
    padding: 0 16px;
    min-height: 48px;
  }

  .ant-card-body {
    padding: 16px;
  }
`;

export const ActionButton = styled(Button)`
  margin-right: 8px;

  &.call-button {
    background: #1890ff;
    border-color: #1890ff;
    color: white;
  }
`;

export const RefreshButton = styled(Button)`
  &:hover {
    color: #1890ff;
    border-color: #1890ff;
  }
`;

export const PatientInfo = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;

  .info-item {
    .label {
      color: #8c8c8c;
      font-size: 12px;
      margin-bottom: 4px;
    }
    .value {
      font-size: 14px;
      font-weight: 500;
    }
  }
`;

export const DrawerContent = styled.div`
  .section {
    margin-bottom: 24px;
    
    .section-title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 16px;
      color: #1890ff;
    }
  }
`;

export const VisitTypeBadge = styled.span`
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  background: ${props => props.className === 'first' ? '#f9f0ff' : '#e6fffb'};
  color: ${props => props.className === 'first' ? '#722ed1' : '#13c2c2'};
  border: 1px solid ${props => props.className === 'first' ? '#d3adf7' : '#87e8de'};
`; 