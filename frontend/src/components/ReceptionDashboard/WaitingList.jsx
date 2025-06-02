import React from 'react';
import { List, Empty, Spin, Tag, Space, Dropdown } from 'antd';
import styled from 'styled-components';
import { DownOutlined } from '@ant-design/icons';

const Container = styled.div`
  padding: 20px;
`;

const StyledCard = styled.div`
  background-color: white;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
`;

const StatusTag = styled(Tag)`
  cursor: pointer;
  &:hover {
    opacity: 0.8;
  }
`;

const WaitingList = ({ queueList = [], loading, onQueueUpdate }) => {
  console.log('Queue List:', queueList); // 전체 데이터 구조 확인

  if (loading) {
    return <Spin size="large" />;
  }

  const handleStatusChange = async (queueId, newStatus) => {
    try {
      await onQueueUpdate(queueId, newStatus);
      console.log('Status updated successfully');
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const getStatusItems = (queueId) => [
    {
      key: 'WAITING',
      label: '대기중',
      onClick: () => handleStatusChange(queueId, 'WAITING')
    },
    {
      key: 'IN_PROGRESS',
      label: '진료중',
      onClick: () => handleStatusChange(queueId, 'IN_PROGRESS')
    },
    {
      key: 'COMPLETED',
      label: '완료',
      onClick: () => handleStatusChange(queueId, 'COMPLETED')
    }
  ];

  const renderPatientName = (item) => {
    if (!item || !item.patientId || !item.patientId.basicInfo) return '이름 없음';
    return item.patientId.basicInfo.name || '이름 없음';
  };

  return (
    <Container>
      {queueList.length > 0 ? (
        <List
          dataSource={queueList}
          renderItem={item => (
            <List.Item>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Space>
                  <span>대기번호: {item.queueNumber}</span>
                  <span>환자명: {renderPatientName(item)}</span>
                  <Dropdown
                    menu={{
                      items: getStatusItems(item._id)
                    }}
                    trigger={['click']}
                  >
                    <StatusTag color={getStatusColor(item.status)}>
                      {getStatusText(item.status)} <DownOutlined />
                    </StatusTag>
                  </Dropdown>
                </Space>
                <Space>
                  <span>방문유형: {item.visitType}</span>
                  <span>증상: {Array.isArray(item.symptoms) ? item.symptoms.join(', ') : item.symptoms}</span>
                  <small>등록시간: {new Date(item.createdAt).toLocaleTimeString()}</small>
                </Space>
              </Space>
            </List.Item>
          )}
        />
      ) : (
        <Empty description="대기중인 환자가 없습니다" />
      )}
    </Container>
  );
};

const getStatusColor = (status) => {
  const colors = {
    'WAITING': 'gold',
    'IN_PROGRESS': 'processing',
    'COMPLETED': 'success'
  };
  return colors[status] || 'gold';
};

const getStatusText = (status) => {
  const texts = {
    'WAITING': '대기중',
    'IN_PROGRESS': '진료중',
    'COMPLETED': '완료'
  };
  return texts[status] || '대기중';
};

export default WaitingList;