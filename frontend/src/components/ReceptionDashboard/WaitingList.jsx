import React, { useMemo } from 'react';
import { List, Button, Tag, Space, message, Empty, Dropdown, Tooltip, Badge, Card } from 'antd';
import { DownOutlined, ClockCircleOutlined, SoundOutlined, ReloadOutlined } from '@ant-design/icons';
import * as queueApi from '../../api/queueApi';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import styled from 'styled-components';

// dayjs 플러그인 설정
dayjs.extend(duration);

const WaitingListCard = styled(Card)`
  border-radius: 16px !important;
  box-shadow: 0 2px 16px rgba(25, 118, 210, 0.08) !important;
  background: ${({ theme }) => theme.card} !important;
  color: ${({ theme }) => theme.text} !important;
  border: 1px solid ${({ theme }) => theme.border} !important;
  margin-bottom: 1.5rem;
  
  .ant-card-body {
    padding: 1.5rem;
    @media (max-width: 700px) {
      padding: 1rem;
    }
  }
`;

const StyledListItem = styled(List.Item)`
  transition: all 0.3s ease;
  border-radius: 8px;
  margin-bottom: 8px;
  padding: 16px;
  background: ${({ theme }) => theme.card};
  border: 1px solid ${({ theme }) => theme.border};
  
  &:hover {
    background: ${({ theme }) => theme.hover};
    box-shadow: 0 2px 8px rgba(25, 118, 210, 0.1);
  }
  
  @media (max-width: 700px) {
    padding: 12px;
  }
`;

const WaitingTimeTag = styled(Tag).withConfig({
  shouldForwardProp: (prop) => prop !== 'isLongWait'
})`
  color: ${props => props.isLongWait ? '#ff4d4f' : 'inherit'};
  border-radius: 12px;
  font-weight: 500;
`;

const StatusSpan = styled.span.withConfig({
  shouldForwardProp: (prop) => prop !== 'isLongWait',
})`
  color: ${({ isLongWait }) => (isLongWait ? 'red' : 'inherit')};
  font-weight: 500;
`;

const StatisticsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 1.5rem;
  padding: 16px;
  background: ${({ theme }) => theme.background};
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.border};
  
  @media (max-width: 700px) {
    gap: 8px;
    padding: 12px;
  }
`;

const PatientInfo = styled.div`
  .patient-name {
    font-weight: 600;
    font-size: 16px;
    color: ${({ theme }) => theme.text};
    margin-bottom: 4px;
  }
  
  .patient-details {
    font-size: 14px;
    color: ${({ theme }) => theme.textSecondary};
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    
    @media (max-width: 700px) {
      gap: 8px;
    }
  }
`;

const WaitingList = ({ queueList = [], onQueueUpdate, loading = false }) => {
  const calculateWaitingTime = (registeredAt) => {
    const waitingDuration = dayjs.duration(dayjs().diff(dayjs(registeredAt)));
    const hours = Math.floor(waitingDuration.asHours());
    const minutes = Math.floor(waitingDuration.asMinutes()) % 60;
    const isLongWait = waitingDuration.asMinutes() > 30;

    return {
      text: hours > 0 ? `${hours}시간 ${minutes}분` : `${minutes}분`,
      isLongWait
    };
  };

  const handleStatusChange = async (queueId, newStatus) => {
    try {
      if (!queueId) {
        message.error('유효하지 않은 대기 ID입니다.');
        return;
      }

      const response = await queueApi.updateQueueStatus(queueId, newStatus);
      if (response.success) {
        message.success(`상태가 ${getStatusText(newStatus)}(으)로 변경되었습니다.`);
        onQueueUpdate?.();
      }
    } catch (error) {
      console.error('상태 변경 실패:', error);
      message.error('상태 변경에 실패했습니다.');
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      waiting: '대기중',
      called: '호출됨',
      consulting: '진료중',
      done: '완료',
      cancelled: '취소됨'
    };
    return statusMap[status] || status;
  };

  const getStatusTag = (status) => {
    const statusMap = {
      waiting: { color: 'blue', text: '대기중', icon: <ClockCircleOutlined /> },
      called: { color: 'orange', text: '호출됨', icon: <SoundOutlined /> },
      consulting: { color: 'green', text: '진료중', icon: null },
      done: { color: 'gray', text: '완료', icon: null },
      cancelled: { color: 'red', text: '취소됨', icon: null }
    };
    const { color, text, icon } = statusMap[status] || { color: 'default', text: status, icon: null };
    return (
      <Tag color={color}>
        <Space>
          {icon}
          {text}
        </Space>
      </Tag>
    );
  };

  const statistics = useMemo(() => {
    return queueList.reduce((acc, queue) => {
      acc[queue.status] = (acc[queue.status] || 0) + 1;
      return acc;
    }, {});
  }, [queueList]);

  const getStatusMenuItems = (queueId, currentStatus) => {
    const menuItems = [
      {
        key: 'waiting',
        label: '대기중으로 변경',
        onClick: () => handleStatusChange(queueId, 'waiting'),
        disabled: currentStatus === 'waiting'
      },
      {
        key: 'called',
        label: '호출하기',
        onClick: () => handleStatusChange(queueId, 'called'),
        disabled: currentStatus === 'called'
      },
      {
        key: 'consulting',
        label: '진료 시작',
        onClick: () => handleStatusChange(queueId, 'consulting'),
        disabled: currentStatus === 'consulting'
      },
      {
        key: 'done',
        label: '진료 완료',
        onClick: () => handleStatusChange(queueId, 'done'),
        disabled: currentStatus === 'done'
      },
      {
        key: 'cancelled',
        label: '취소',
        onClick: () => handleStatusChange(queueId, 'cancelled'),
        disabled: currentStatus === 'cancelled',
        danger: true
      }
    ];

    return menuItems.filter(item => !item.disabled);
  };

  if (!queueList || queueList.length === 0) {
    return (
      <WaitingListCard>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="현재 대기 중인 환자가 없습니다."
        >
          <Button 
            type="primary" 
            icon={<ReloadOutlined />} 
            onClick={onQueueUpdate}
            loading={loading}
          >
            새로고침
          </Button>
        </Empty>
      </WaitingListCard>
    );
  }

  return (
    <WaitingListCard>
      <StatisticsContainer>
        {Object.entries(statistics).map(([status, count]) => (
          <Badge key={status} count={count} style={{ backgroundColor: status === 'waiting' ? '#1890ff' : '#999' }}>
            <Tag color={status === 'waiting' ? 'blue' : 'default'}>
              <StatusSpan isLongWait={status === 'waiting'}>
                {getStatusText(status)}
              </StatusSpan>
            </Tag>
          </Badge>
        ))}
        <Button 
          type="primary" 
          icon={<ReloadOutlined />} 
          onClick={onQueueUpdate}
          loading={loading}
        >
          새로고침
        </Button>
      </StatisticsContainer>

      <List
        loading={loading}
        dataSource={queueList}
        renderItem={(item) => {
          const queueId = item._id;
          const waitingTime = calculateWaitingTime(item.registeredAt);
          const patient = item.patientId?.basicInfo || {};
          
          return (
            <StyledListItem
              key={queueId}
              actions={[
                <Dropdown
                  menu={{ items: getStatusMenuItems(queueId, item.status) }}
                  trigger={['click']}
                >
                  <Button type="primary">
                    상태 변경 <DownOutlined />
                  </Button>
                </Dropdown>
              ]}
            >
              <List.Item.Meta
                title={
                  <PatientInfo>
                    <div className="patient-name">
                      #{item.queueNumber} {patient.name || '이름 없음'}
                    </div>
                    <div className="patient-details">
                      {patient.phoneNumber && <span>📞 {patient.phoneNumber}</span>}
                      {patient.gender && <span>👤 {patient.gender === 'male' ? '남성' : '여성'}</span>}
                      <span>🏥 {item.visitType === 'first' ? '초진' : '재진'}</span>
                      <WaitingTimeTag isLongWait={waitingTime.isLongWait}>
                        ⏱️ {waitingTime.text}
                      </WaitingTimeTag>
                      {getStatusTag(item.status)}
                    </div>
                    {item.symptoms?.length > 0 && (
                      <div style={{ marginTop: '8px', fontSize: '13px', color: '#666' }}>
                        💊 증상: {item.symptoms.join(', ')}
                      </div>
                    )}
                  </PatientInfo>
                }
              />
            </StyledListItem>
          );
        }}
      />
    </WaitingListCard>
  );
};

export default WaitingList;