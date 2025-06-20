import React, { useMemo } from 'react';
import { List, Button, Tag, Space, message, Empty, Dropdown, Tooltip, Badge } from 'antd';
import { DownOutlined, ClockCircleOutlined, SoundOutlined, ReloadOutlined } from '@ant-design/icons';
import * as queueApi from '../../api/queueApi';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import styled from 'styled-components';

// dayjs 플러그인 설정
dayjs.extend(duration);

const StyledListItem = styled(List.Item)`
  transition: all 0.3s ease;
  &:hover {
    background-color: #f5f5f5;
  }
`;

const WaitingTimeTag = styled(Tag).withConfig({
  shouldForwardProp: (prop) => prop !== 'isLongWait'
})`
  color: ${props => props.isLongWait ? '#ff4d4f' : 'inherit'};
`;

const StatusSpan = styled.span.withConfig({
  shouldForwardProp: (prop) => prop !== 'isLongWait',
})`
  color: ${({ isLongWait }) => (isLongWait ? 'red' : 'black')};
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
    );
  }

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
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
      </Space>

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
                  <Space>
                    <span style={{ fontWeight: 'bold' }}>#{item.queueNumber}</span>
                    <span>{patient.name || '이름 없음'}</span>
                    {getStatusTag(item.status)}
                    <Tooltip title={`대기 시작: ${dayjs(item.registeredAt).format('HH:mm')}`}>
                      <WaitingTimeTag isLongWait={waitingTime.isLongWait}>
                        <ClockCircleOutlined /> {waitingTime.text}
                      </WaitingTimeTag>
                    </Tooltip>
                  </Space>
                }
                description={
                  <Space direction="vertical">
                    <span>방문유형: {item.visitType === 'first' ? '초진' : '재진'}</span>
                    <span>연락처: {patient.phoneNumber || '정보 없음'}</span>
                    {item.symptoms?.length > 0 && (
                      <span>증상: {item.symptoms.join(', ')}</span>
                    )}
                  </Space>
                }
              />
            </StyledListItem>
          );
        }}
        style={{ 
          backgroundColor: 'white',
          border: '1px solid #f0f0f0',
          borderRadius: '8px',
          minHeight: '200px'
        }}
      />
    </div>
  );
};

export default WaitingList;