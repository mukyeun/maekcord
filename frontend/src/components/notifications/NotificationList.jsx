import React, { useState, useEffect } from 'react';
import { List, Badge, Button, Typography, Space, Tag } from 'antd';
import {
  CalendarOutlined,
  EditOutlined,
  CloseCircleOutlined,
  BellOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import moment from 'moment';
import 'moment/locale/ko';  // 한글 로케일 추가
import { getNotifications, markAllAsRead, markAsRead } from '../../api/notificationApi';
import websocketService from '../../services/websocket.service';

const { Text } = Typography;

// 알림 타입별 아이콘과 색상 설정
const NOTIFICATION_ICONS = {
  appointment: {
    icon: CalendarOutlined,
    color: '#1890ff'  // 파란색
  },
  system: {
    icon: BellOutlined,
    color: '#52c41a'  // 녹색
  },
  message: {
    icon: EditOutlined,
    color: '#faad14'  // 주황색
  }
};

const PRIORITY_COLORS = {
  high: '#ff4d4f',    // 빨간색
  medium: '#faad14',  // 주황색
  low: '#52c41a'      // 녹색
};

const PRIORITY_LABELS = {
  high: '높음',
  medium: '중간',
  low: '낮음'
};

const NotificationList = ({ onRead }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // 한글 로케일 설정
  moment.locale('ko');

  const fetchNotifications = async (page = 1) => {
    try {
      setLoading(true);
      const response = await getNotifications(page, pagination.pageSize);
      setNotifications(response.notifications);
      setPagination({
        ...pagination,
        current: response.page,
        total: response.total
      });
    } catch (error) {
      console.error('알림 목록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // WebSocket 이벤트 리스너 등록
    const handleNewNotification = (data) => {
      if (data.type === 'new_notification') {
        setNotifications(prev => [data.notification, ...prev]);
        onRead(); // 읽지 않은 알림 수 업데이트
      } else if (data.type === 'notification_updated') {
        setNotifications(prev => 
          prev.map(notif => 
            notif._id === data.notification._id ? data.notification : notif
          )
        );
        onRead();
      } else if (data.type === 'all_notifications_read') {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, isRead: true }))
        );
        onRead();
      }
    };

    websocketService.addEventListener('new_notification', handleNewNotification);
    websocketService.addEventListener('notification_updated', handleNewNotification);
    websocketService.addEventListener('all_notifications_read', handleNewNotification);

    // WebSocket 연결
    websocketService.connect();

    return () => {
      websocketService.removeEventListener('new_notification', handleNewNotification);
      websocketService.removeEventListener('notification_updated', handleNewNotification);
      websocketService.removeEventListener('all_notifications_read', handleNewNotification);
      websocketService.disconnect();
    };
  }, [onRead]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markAsRead(notificationId);
      fetchNotifications(pagination.current);
    } catch (error) {
      console.error('알림 읽음 처리 실패:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      fetchNotifications(pagination.current);
    } catch (error) {
      console.error('전체 알림 읽음 처리 실패:', error);
    }
  };

  const formatRelativeTime = (date) => {
    const now = moment();
    const targetDate = moment(date);
    const diffMinutes = now.diff(targetDate, 'minutes');
    const diffHours = now.diff(targetDate, 'hours');
    const diffDays = now.diff(targetDate, 'days');

    if (diffMinutes < 1) {
      return '방금 전';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}분 전`;
    } else if (diffHours < 24) {
      return `${diffHours}시간 전`;
    } else if (diffDays < 7) {
      return `${diffDays}일 전`;
    } else {
      return targetDate.format('YYYY년 M월 D일');
    }
  };

  const renderNotificationContent = (notification) => {
    const { type, title, message, createdAt, isRead, priority } = notification;
    const NotificationIcon = NOTIFICATION_ICONS[type]?.icon || BellOutlined;
    const iconColor = isRead ? '#999' : NOTIFICATION_ICONS[type]?.color || '#1890ff';
    
    return (
      <Space direction="vertical" style={{ width: '100%' }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <NotificationIcon style={{ color: iconColor, fontSize: 16 }} />
            <Text strong style={{ color: isRead ? '#999' : 'inherit' }}>{title}</Text>
            <Tag color={PRIORITY_COLORS[priority]} style={{ marginLeft: 8 }}>
              {PRIORITY_LABELS[priority]}
            </Tag>
          </Space>
          <Text type="secondary">
            {formatRelativeTime(createdAt)}
          </Text>
        </Space>
        <Text style={{ color: isRead ? '#999' : 'inherit' }}>{message}</Text>
        {!isRead && (
          <Button
            type="link"
            size="small"
            onClick={() => handleMarkAsRead(notification._id)}
          >
            읽음 표시
          </Button>
        )}
      </Space>
    );
  };

  return (
    <div>
      <Space style={{ marginBottom: 16, justifyContent: 'space-between', width: '100%' }}>
        <Typography.Title level={4}>알림</Typography.Title>
        <Button onClick={handleMarkAllAsRead}>모두 읽음 표시</Button>
      </Space>
      
      <List
        loading={loading}
        dataSource={notifications}
        renderItem={(notification) => (
          <List.Item style={{ 
            backgroundColor: notification.isRead ? 'transparent' : 'rgba(24, 144, 255, 0.05)',
            transition: 'background-color 0.3s'
          }}>
            {renderNotificationContent(notification)}
          </List.Item>
        )}
        pagination={{
          ...pagination,
          onChange: (page) => fetchNotifications(page)
        }}
        locale={{
          emptyText: '알림이 없습니다.'
        }}
      />
    </div>
  );
};

export default NotificationList; 