import React, { useState } from 'react';
import { AppBar, Toolbar, IconButton, Typography, Box, Button, Badge, Avatar, Drawer, List, ListItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import PeopleIcon from '@mui/icons-material/People';
import TodayIcon from '@mui/icons-material/Today';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import EventNoteIcon from '@mui/icons-material/EventNote';
import AppointmentManagerModal from '../appointments/AppointmentManagerModal';

const mainMenus = [
  { label: '대시보드', icon: <DashboardIcon />, to: '/' },
  { label: '환자 정보입력', icon: <PersonAddIcon />, to: '/patient/new' },
  { label: '접수실', icon: <AssignmentIndIcon />, to: '/reception' },
  { label: '진료실', icon: <LocalHospitalIcon />, to: '/doctor' },
  { label: '대기목록', icon: <PeopleIcon />, to: '/queue' },
  { label: '예약', icon: <EventNoteIcon />, to: '/appointments' },
  { label: '환자 데이터', icon: <PersonAddIcon />, to: '/patient-data' },
];

const dummyNotifications = [
  { id: 1, message: '새 환자 접수: 홍길동', time: '1분 전' },
  { id: 2, message: '진료실 호출: 김철수', time: '5분 전' },
  { id: 3, message: '예약 알림: 박영희', time: '10분 전' },
];

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(state => state.auth.isAuthenticated);
  const [notifOpen, setNotifOpen] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [isAppointmentModalOpen, setAppointmentModalOpen] = useState(false);

  // 상단 네비게이션 메뉴 렌더링
  const renderMenu = (isMobile = false) => (
    <Box sx={{ display: isMobile ? 'block' : 'flex', alignItems: 'center', gap: 2 }}>
      {mainMenus.map(menu => (
        <Button
          key={menu.label}
          startIcon={menu.icon}
          onClick={() => {
            if (menu.to === '/appointments') {
              setAppointmentModalOpen(true);
              setMobileMenuOpen(false);
            } else {
              navigate(menu.to);
              setMobileMenuOpen(false);
            }
          }}
          sx={{
            color: location.pathname === menu.to ? 'primary.main' : 'text.primary',
            fontWeight: location.pathname === menu.to ? 700 : 500,
            bgcolor: location.pathname === menu.to ? 'rgba(25,118,210,0.08)' : 'transparent',
            borderRadius: 2,
            px: 2,
            my: isMobile ? 1 : 0,
            width: isMobile ? '100%' : 'auto',
            justifyContent: isMobile ? 'flex-start' : 'center',
          }}
          fullWidth={isMobile}
        >
          {menu.label}
        </Button>
      ))}
    </Box>
  );

  return (
    <>
      <AppBar position="sticky" elevation={2} sx={{ bgcolor: '#fff', color: 'text.primary', zIndex: 1201 }}>
        <Toolbar sx={{ justifyContent: 'space-between', minHeight: 64 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton edge="start" color="primary" sx={{ mr: 1 }} onClick={() => navigate('/')}> 
              <img src="/logo192.png" alt="MaekCode" style={{ width: 36, height: 36 }} />
            </IconButton>
            <Typography variant="h6" fontWeight={700} sx={{ letterSpacing: 1, color: 'primary.main', mr: 2, cursor: 'pointer' }} onClick={() => navigate('/')}>MaekCode</Typography>
            {/* 데스크탑 메뉴 */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
              {renderMenu(false)}
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* 모바일 메뉴 버튼 */}
            <Box sx={{ display: { xs: 'block', md: 'none' } }}>
              <IconButton onClick={() => setMobileMenuOpen(true)}>
                <MenuIcon />
              </IconButton>
            </Box>
            {/* 알림 아이콘 */}
            <IconButton color="primary" onClick={() => setNotifOpen(true)}>
              <Badge badgeContent={dummyNotifications.length} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
            {/* 로그인/로그아웃 버튼 */}
            {isAuthenticated ? (
              <Button color="primary" onClick={() => dispatch(logout())}>로그아웃</Button>
            ) : (
              <Button color="primary" onClick={() => navigate('/login')}>로그인</Button>
            )}
            {/* 프로필 아바타 */}
            <IconButton>
              <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>U</Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      {/* 모바일 메뉴 Drawer */}
      <Drawer anchor="left" open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)}>
        <Box sx={{ width: 240, p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <img src="/logo192.png" alt="MaekCode" style={{ width: 32, height: 32, marginRight: 8 }} />
            <Typography variant="h6" fontWeight={700} color="primary">MaekCode</Typography>
            <IconButton sx={{ ml: 'auto' }} onClick={() => setMobileMenuOpen(false)}><CloseIcon /></IconButton>
          </Box>
          {renderMenu(true)}
        </Box>
      </Drawer>
      {/* 알림 패널 Drawer */}
      <Drawer
        anchor="right"
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        PaperProps={{
          sx: {
            top: '64px',
            height: 'calc(100% - 64px)',
            zIndex: 1301,
          }
        }}
      >
        <Box sx={{ width: 320, p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <NotificationsIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6" fontWeight={700}>알림</Typography>
            <IconButton sx={{ ml: 'auto' }} onClick={() => setNotifOpen(false)}><CloseIcon /></IconButton>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <List>
            {dummyNotifications.map(n => (
              <ListItem key={n.id} alignItems="flex-start">
                <ListItemIcon><NotificationsIcon color="primary" /></ListItemIcon>
                <ListItemText primary={n.message} secondary={n.time} />
              </ListItem>
            ))}
            {dummyNotifications.length === 0 && (
              <Typography color="text.secondary">새로운 알림이 없습니다.</Typography>
            )}
          </List>
        </Box>
      </Drawer>
      {/* 예약 전체 관리 모달 */}
      <AppointmentManagerModal
        open={isAppointmentModalOpen}
        onClose={() => setAppointmentModalOpen(false)}
      />
    </>
  );
};

export default Header; 