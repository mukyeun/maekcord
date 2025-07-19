import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Layout, Button, Space, Typography, Modal, Form, Input, message, Badge, Tooltip, Card } from 'antd';
import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  MenuOutlined, 
  UserOutlined, 
  LoginOutlined,
  LogoutOutlined,
  TableOutlined,
  SafetyCertificateOutlined,
  ExclamationCircleOutlined,
  LockOutlined
} from '@ant-design/icons';
import { loginUser, logout, checkSecurityStatus } from '../../store/slices/authSlice';
import WebSocketStatus from './WebSocketStatus';
import PerformanceMonitor from './PerformanceMonitor';

const { Title } = Typography;

const Logo = styled(Title)`
  margin: 0 !important;
  color: #1e40af !important;
  font-size: 36px !important;
  font-weight: 800 !important;
  background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  transform: translateZ(0);
`;

const ActionButton = styled(Button)`
  margin-left: 8px;
  transform: translateZ(0);
`;

const LoginButton = styled(Button)`
  margin-left: 16px;
  background-color: #1890ff;
  border-color: #1890ff;
  transform: translateZ(0);
  
  &:hover {
    background-color: #40a9ff;
    border-color: #40a9ff;
  }
`;

const HeaderBar = styled.header`
  width: 100%;
  height: 64px;
  background: ${({ theme }) => theme.card};
  color: ${({ theme }) => theme.primary};
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  position: fixed;
  top: 0;
  left: 0;
  z-index: 100;
  padding: 0 2rem;
  transform: translateZ(0);
  will-change: transform;
`;

const Nav = styled.nav`
  display: flex;
  gap: 2rem;
  align-items: center;
  
  @media (max-width: 700px) {
    display: none;
  }
`;

const NavItem = styled.a`
  color: ${({ theme }) => theme.text};
  font-weight: 600;
  font-size: 1rem;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  white-space: nowrap;
  transform: translateZ(0);
  backface-visibility: hidden;
  
  &:hover {
    color: ${({ theme }) => theme.primary};
    background: rgba(30, 64, 175, 0.1);
  }
`;

const UserMenu = styled.div`
  display: flex;
  align-items: center;
  gap: 1.2rem;
  transform: translateZ(0);
`;

const IconBtn = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.primary};
  font-size: 1.3rem;
  cursor: pointer;
  padding: 0 0.5rem;
  transform: translateZ(0);
  backface-visibility: hidden;
  
  &:hover {
    color: ${({ theme }) => theme.accent};
  }
`;

const SecurityStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
  transform: translateZ(0);
  backface-visibility: hidden;
  
  &.secure {
    background: #f6ffed;
    color: #52c41a;
    border: 1px solid #b7eb8f;
  }
  
  &.warning {
    background: #fffbe6;
    color: #faad14;
    border: 1px solid #ffe58f;
  }
  
  &.danger {
    background: #fff2f0;
    color: #ff4d4f;
    border: 1px solid #ffccc7;
  }
`;

export const GlassCard = styled(Card)`
  background: rgba(255, 255, 255, 0.35);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
  backdrop-filter: blur(8px);
  border-radius: 20px;
  border: 1px solid rgba(255,255,255,0.18);
  transform: translateZ(0);
  backface-visibility: hidden;
  
  &:hover {
    box-shadow: 0 16px 48px 0 rgba(16, 185, 129, 0.18);
    transform: translateY(-8px) scale(1.03) translateZ(0);
  }
`;

const Header = React.memo(({ onToggle, onToggleDark, dark }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user, loading, securityStatus } = useSelector((state) => state.auth);
  const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);

  // 보안 상태 체크
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(checkSecurityStatus());
    }
  }, [dispatch, isAuthenticated]);

  const handleLogin = useCallback(async (values) => {
    try {
      const result = await dispatch(loginUser(values)).unwrap();
      if (result) {
        setIsLoginModalVisible(false);
        message.success('로그인되었습니다.');
      }
    } catch (error) {
      message.error('아이디 또는 비밀번호가 잘못되었습니다.');
    }
  }, [dispatch]);

  const handleLogout = useCallback(() => {
    dispatch(logout());
    message.success('로그아웃되었습니다.');
  }, [dispatch]);

  const handleLoginModalToggle = useCallback(() => {
    setIsLoginModalVisible(prev => !prev);
  }, []);

  // 보안 상태 표시
  const renderSecurityStatus = useMemo(() => {
    if (!isAuthenticated) return null;

    const { isSecure, warnings } = securityStatus;
    
    if (isSecure) {
      return (
        <Tooltip title="보안 상태 양호">
          <SecurityStatus className="secure">
            <SafetyCertificateOutlined />
            보안
          </SecurityStatus>
        </Tooltip>
      );
    }

    if (warnings.length > 0) {
      return (
        <Tooltip title={`보안 경고: ${warnings.join(', ')}`}>
          <SecurityStatus className="warning">
            <ExclamationCircleOutlined />
            경고
          </SecurityStatus>
        </Tooltip>
      );
    }

    return (
      <Tooltip title="보안 상태 확인 필요">
        <SecurityStatus className="danger">
          <ExclamationCircleOutlined />
          위험
        </SecurityStatus>
      </Tooltip>
    );
  }, [isAuthenticated, securityStatus]);

  return (
    <HeaderBar>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <Logo level={1}>맥진</Logo>
        
        <Nav>
          <NavItem href="/">홈</NavItem>
          <NavItem href="/reception">접수실</NavItem>
          <NavItem href="/doctor">진료실</NavItem>
          <NavItem href="/queue">대기열</NavItem>
        </Nav>
      </div>

      <UserMenu>
        {renderSecurityStatus}
        
        <WebSocketStatus />
        <PerformanceMonitor />
        
        {isAuthenticated ? (
          <Space>
            <Badge count={user?.notifications?.length || 0}>
              <IconBtn onClick={onToggle}>
                <UserOutlined />
              </IconBtn>
            </Badge>
            
            <Tooltip title="로그아웃">
              <IconBtn onClick={handleLogout}>
                <LogoutOutlined />
              </IconBtn>
            </Tooltip>
          </Space>
        ) : (
          <LoginButton 
            type="primary" 
            icon={<LoginOutlined />}
            onClick={handleLoginModalToggle}
            loading={loading}
          >
            로그인
          </LoginButton>
        )}
      </UserMenu>

      <Modal
        title="로그인"
        open={isLoginModalVisible}
        onCancel={handleLoginModalToggle}
        footer={null}
        destroyOnHidden
      >
        <Form
          name="login"
          onFinish={handleLogin}
          layout="vertical"
          autoComplete="off"
        >
          <Form.Item
            name="username"
            label="아이디"
            rules={[{ required: true, message: '아이디를 입력해주세요!' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="아이디" />
          </Form.Item>

          <Form.Item
            name="password"
            label="비밀번호"
            rules={[{ required: true, message: '비밀번호를 입력해주세요!' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="비밀번호" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              로그인
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </HeaderBar>
  );
});

Header.displayName = 'Header';

export default Header;