
import React from 'react';
import { List, Button, Tag, Space, message, Empty, Dropdown } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import * as queueApi from '../../api/queueApi';

const WaitingList = ({ queueList = [], onQueueUpdate }) => {
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
      WAITING: '대기중',
      CALLED: '호출됨',
      CONSULTING: '진료중',
      COMPLETED: '완료'
    };
    return statusMap[status] || status;
  };

  const getStatusTag = (status) => {
    const statusMap = {
      WAITING: { color: 'blue', text: '대기중' },
      CALLED: { color: 'orange', text: '호출됨' },
      CONSULTING: { color: 'green', text: '진료중' },
      COMPLETED: { color: 'gray', text: '완료' }
    };
    const { color, text } = statusMap[status] || { color: 'default', text: status };
    return <Tag color={color}>{text}</Tag>;
  };

  const getStatusMenuItems = (queueId, currentStatus) => {
    const items = [];
    
    switch (currentStatus) {
      case 'WAITING':
        items.push({
          key: 'CALLED',
          label: '호출하기',
          onClick: () => handleStatusChange(queueId, 'CALLED')
        });
        break;
      case 'CALLED':
        items.push({
          key: 'CONSULTING',
          label: '진료 시작',
          onClick: () => handleStatusChange(queueId, 'CONSULTING')
        });
        items.push({
          key: 'WAITING',
          label: '대기로 되돌리기',
          onClick: () => handleStatusChange(queueId, 'WAITING')
        });
        break;
      case 'CONSULTING':
        items.push({
          key: 'COMPLETED',
          label: '진료 완료',
          onClick: () => handleStatusChange(queueId, 'COMPLETED')
        });
        items.push({
          key: 'CALLED',
          label: '호출 상태로 되돌리기',
          onClick: () => handleStatusChange(queueId, 'CALLED')
        });
        break;
      case 'COMPLETED':
        items.push({
          key: 'CONSULTING',
          label: '진료중으로 되돌리기',
          onClick: () => handleStatusChange(queueId, 'CONSULTING')
        });
        break;
      default:
        break;
    }
    
    return items;
  };

  if (!queueList || queueList.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="현재 대기 중인 환자가 없습니다."
      >
        <Button type="primary" onClick={onQueueUpdate}>새로고침</Button>
      </Empty>
    );
  }

  return (
    <List
      dataSource={queueList}
      renderItem={(item) => {
        const queueId = item._id || item.id;
        // 모든 상태에 대해 메뉴 아이템 생성
        const menuItems = [
          {
            key: 'WAITING',
            label: '대기중으로 변경',
            onClick: () => handleStatusChange(queueId, 'WAITING'),
            disabled: item.status === 'WAITING'
          },
          {
            key: 'CALLED',
            label: '호출하기',
            onClick: () => handleStatusChange(queueId, 'CALLED'),
            disabled: item.status === 'CALLED'
          },
          {
            key: 'CONSULTING',
            label: '진료 시작',
            onClick: () => handleStatusChange(queueId, 'CONSULTING'),
            disabled: item.status === 'CONSULTING'
          },
          {
            key: 'COMPLETED',
            label: '진료 완료',
            onClick: () => handleStatusChange(queueId, 'COMPLETED'),
            disabled: item.status === 'COMPLETED'
          }
        ];
        
        return (
          <List.Item
            key={queueId}
            actions={[
              <Dropdown
                menu={{ 
                  items: menuItems.filter(item => !item.disabled)
                }}
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
                  <span style={{ fontWeight: 'bold' }}>#{item.waitingNumber}</span>
                  <span>{item.name || item.patientName}</span>
                  {getStatusTag(item.status)}
                </Space>
              }
              description={
                <Space direction="vertical">
                  <span>생년월일: {item.birthDate || item.birth || '정보 없음'}</span>
                  <span>연락처: {item.phoneNumber || item.phone || '정보 없음'}</span>
                </Space>
              }
            />
          </List.Item>
        );
      }}
      style={{ 
        backgroundColor: 'white',
        border: '1px solid #f0f0f0',
        borderRadius: '8px',
        minHeight: '200px'
      }}
    />
  );
};

export default WaitingList; 