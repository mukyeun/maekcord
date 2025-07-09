import React, { useState, useEffect } from 'react';
import { Layout, Badge, Popover, Button } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import NotificationList from '../notifications/NotificationList';
import { getUnreadCount } from '../../api/notificationApi';
import WebSocketStatus from '../Common/WebSocketStatus';

const { Header: AntHeader } = Layout;

const Header = () => {
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('알림 수 조회 실패:', error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    // 1분마다 알림 수 갱신
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AntHeader style={{ background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
      <WebSocketStatus />
      <Popover
        placement="bottomRight"
        content={<NotificationList onRead={fetchUnreadCount} />}
        trigger="click"
        overlayStyle={{ width: 400 }}
      >
        <Badge count={unreadCount} offset={[-5, 5]}>
          <Button type="text" icon={<BellOutlined style={{ fontSize: 20 }} />} />
        </Badge>
      </Popover>
    </AntHeader>
  );
};

export default Header; 