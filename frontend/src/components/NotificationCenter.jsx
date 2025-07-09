import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Badge,
  IconButton,
  Popover,
  List,
  ListItem,
  ListItemText,
  Typography,
  Divider,
  Button,
  Chip,
  CircularProgress,
  useTheme,
  Tabs,
  Tab,
  Tooltip
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { fetchNotifications, markAsRead, markAllAsRead } from '../redux/slices/notificationSlice';
import NotificationSettings from './NotificationSettings';
import { useWebSocket } from '../hooks/useWebSocket';
import debounce from 'lodash/debounce';

const NotificationCenter = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const lastFetchRef = useRef(Date.now());
  const FETCH_COOLDOWN = 5000; // 5 seconds cooldown between fetches
  const pollingIntervalRef = useRef(null);
  const POLLING_INTERVAL = 30000; // 30초
  
  const {
    notifications,
    unreadCount,
    loading,
    error
  } = useSelector((state) => state.notifications);

  // Debounced fetch notifications
  const debouncedFetch = useCallback(
    debounce(() => {
      const now = Date.now();
      if (now - lastFetchRef.current >= FETCH_COOLDOWN) {
        dispatch(fetchNotifications());
        lastFetchRef.current = now;
      }
    }, 300),
    [dispatch]
  );

  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) return;
    
    pollingIntervalRef.current = setInterval(() => {
      debouncedFetch();
    }, POLLING_INTERVAL);
  }, [debouncedFetch]);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  const handleNotification = useCallback((data) => {
    if (data.type === 'new_notification') {
      debouncedFetch();
    }
  }, [debouncedFetch]);

  const handleError = useCallback((error) => {
    console.error('WebSocket 오류:', error);
  }, []);

  const handleReconnect = useCallback(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const { isConnected } = useWebSocket({
    onMessage: handleNotification,
    onError: handleError,
    onReconnect: handleReconnect
  });

  // WebSocket 연결 상태에 따라 폴링 제어
  useEffect(() => {
    if (isConnected) {
      stopPolling(); // WebSocket 연결되면 폴링 중단
    } else {
      startPolling(); // WebSocket 끊기면 폴링 시작
    }

    return () => {
      stopPolling();
      debouncedFetch.cancel();
    };
  }, [isConnected, startPolling, stopPolling, debouncedFetch]);

  // 초기 데이터 로드
  useEffect(() => {
    debouncedFetch();
  }, [debouncedFetch]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    debouncedFetch();
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAsRead = useCallback((id) => {
    dispatch(markAsRead(id));
  }, [dispatch]);

  const handleMarkAllAsRead = useCallback(() => {
    dispatch(markAllAsRead());
  }, [dispatch]);

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high':
        return <ErrorIcon color="error" />;
      case 'medium':
        return <WarningIcon color="warning" />;
      case 'low':
        return <InfoIcon color="info" />;
      default:
        return <InfoIcon />;
    }
  };

  const getNotificationTypeColor = (type) => {
    switch (type) {
      case 'appointment_created':
      case 'appointment_updated':
      case 'appointment_reminder':
        return theme.palette.primary.main;
      case 'appointment_cancelled':
        return theme.palette.error.main;
      case 'vital_sign_critical':
        return theme.palette.error.main;
      case 'vital_sign_warning':
        return theme.palette.warning.main;
      case 'vital_sign_normal':
        return theme.palette.success.main;
      case 'system':
        return theme.palette.info.main;
      default:
        return theme.palette.text.secondary;
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (selectedTab) {
      case 0: // 전체
        return true;
      case 1: // 읽지 않음
        return !notification.isRead;
      case 2: // 중요
        return notification.priority === 'high';
      case 3: // 예약
        return notification.type.startsWith('appointment_');
      case 4: // 활력징후
        return notification.type.startsWith('vital_sign_');
      default:
        return true;
    }
  });

  const open = Boolean(anchorEl);
  const id = open ? 'notification-popover' : undefined;

  return (
    <>
      <IconButton
        aria-describedby={id}
        onClick={handleClick}
        color="inherit"
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
        {!isConnected && (
          <Tooltip title="실시간 알림 연결 끊김">
            <ErrorIcon
              sx={{
                position: 'absolute',
                bottom: -8,
                right: -8,
                color: theme.palette.error.main,
                fontSize: '1rem'
              }}
            />
          </Tooltip>
        )}
      </IconButton>

      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            width: 400,
            maxHeight: 600,
          }
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">알림</Typography>
          <Box>
            <Tooltip title="알림 설정">
              <IconButton onClick={() => setShowSettings(true)} size="small">
                <SettingsIcon />
              </IconButton>
            </Tooltip>
            {unreadCount > 0 && (
              <Button
                startIcon={<CheckIcon />}
                onClick={handleMarkAllAsRead}
                size="small"
                sx={{ ml: 1 }}
              >
                모두 읽음
              </Button>
            )}
          </Box>
        </Box>

        <Divider />

        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="전체" />
          <Tab label={`읽지 않음 (${unreadCount})`} />
          <Tab label="중요" />
          <Tab label="예약" />
          <Tab label="활력징후" />
        </Tabs>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography color="error">알림을 불러오는 중 오류가 발생했습니다.</Typography>
          </Box>
        ) : filteredNotifications.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography color="textSecondary">알림이 없습니다.</Typography>
          </Box>
        ) : (
          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
            {filteredNotifications.map((notification) => (
              <React.Fragment key={notification._id}>
                <ListItem
                  alignItems="flex-start"
                  sx={{
                    bgcolor: notification.isRead ? 'transparent' : 'action.hover',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <Box sx={{ mr: 2, mt: 1 }}>
                    {getPriorityIcon(notification.priority)}
                  </Box>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle1" component="span">
                          {notification.title}
                        </Typography>
                        <Chip
                          label={formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                            locale: ko
                          })}
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography
                          component="span"
                          variant="body2"
                          color="textPrimary"
                          sx={{ display: 'block', my: 1 }}
                        >
                          {notification.message}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Chip
                            label={notification.type.replace(/_/g, ' ')}
                            size="small"
                            sx={{
                              bgcolor: getNotificationTypeColor(notification.type),
                              color: 'white',
                            }}
                          />
                          {!notification.isRead && (
                            <Button
                              size="small"
                              onClick={() => handleMarkAsRead(notification._id)}
                            >
                              읽음 표시
                            </Button>
                          )}
                        </Box>
                      </>
                    }
                  />
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))}
          </List>
        )}
      </Popover>

      <NotificationSettings
        open={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </>
  );
};

export default NotificationCenter; 