import React, { useState, useEffect } from 'react';
import { Layout, Button, Space, Typography, Modal, Form, Input, message, Badge, Tooltip } from 'antd';
import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  MenuOutlined, 
  UserOutlined, 
  DesktopOutlined, 
  OrderedListOutlined,
  MedicineBoxOutlined,
  LoginOutlined,
  LogoutOutlined,
  TableOutlined,
  SafetyCertificateOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { loginUser, logout, checkSecurityStatus } from '../../store/slices/authSlice';
import ReceptionDashboard from '../ReceptionDashboard/ReceptionDashboard';
import QueueDisplay from '../QueueDisplay/QueueDisplay';
import DoctorView from '../DoctorView/DoctorView';
import WebSocketStatus from './WebSocketStatus';
import PerformanceMonitor from './PerformanceMonitor';

const { Title } = Typography;

const StyledHeader = styled(Layout.Header)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  position: fixed;
  width: 100%;
  z-index: 1000;
`;

const Logo = styled(Title)`
  margin: 0 !important;
  color: #1890ff !important;
  font-size: 36px !important;
  font-weight: 800 !important;
`;

const ActionButton = styled(Button)`
  margin-left: 8px;
`;

const LoginButton = styled(Button)`
  margin-left: 16px;
  background-color: #1890ff;
  border-color: #1890ff;
  
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
`;

const Nav = styled.nav`
  display: flex;
  gap: 2rem;
  @media (max-width: 700px) {
    display: none;
  }
`;

const NavItem = styled.a`
  color: ${({ theme }) => theme.text};
  font-weight: 600;
  font-size: 1rem;
  text-decoration: none;
  transition: color 0.2s;
  &:hover {
    color: ${({ theme }) => theme.primary};
  }
`;

const UserMenu = styled.div`
  display: flex;
  align-items: center;
  gap: 1.2rem;
`;

const IconBtn = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.primary};
  font-size: 1.3rem;
  cursor: pointer;
  padding: 0 0.5rem;
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

const Header = ({ onToggle, onToggleDark, dark }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user, loading, securityStatus } = useSelector((state) => state.auth);
  const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);
  const [isDoctorViewVisible, setIsDoctorViewVisible] = useState(false);
  const [isReceptionDashboardVisible, setIsReceptionDashboardVisible] = useState(false);
  const [isQueueDisplayVisible, setIsQueueDisplayVisible] = useState(false);

  // 보안 상태 체크
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(checkSecurityStatus());
    }
  }, [dispatch, isAuthenticated]);

  const handleLogin = async (values) => {
    try {
      const result = await dispatch(loginUser(values)).unwrap();
      if (result) {
        setIsLoginModalVisible(false);
        message.success('로그인되었습니다.');
      }
    } catch (error) {
      message.error('아이디 또는 비밀번호가 잘못되었습니다.');
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    message.success('로그아웃되었습니다.');
  };

  // 보안 상태 표시
  const renderSecurityStatus = () => {
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
      <Tooltip title="보안 상태 확인 중">
        <SecurityStatus className="danger">
          <ExclamationCircleOutlined />
          확인 필요
        </SecurityStatus>
      </Tooltip>
    );
  };

  return (
    <HeaderBar>
      <Logo>
        <MenuOutlined style={{ marginRight: 12, fontSize: 22 }} />
        Maekcord
      </Logo>
      <Nav>
        <NavItem href="/">대시보드</NavItem>
        <NavItem href="/patients">환자관리</NavItem>
        <NavItem href="/stats">통계</NavItem>
      </Nav>
      <UserMenu>
        <WebSocketStatus compact showDetails />
        {renderSecurityStatus()}
        <PerformanceMonitor showDetails={false} />
        <IconBtn onClick={onToggleDark} title="다크모드 전환">
          {dark ? '🌙' : '☀️'}
        </IconBtn>
        {isAuthenticated ? (
          <>
            <span style={{ marginRight: 8 }}>{user?.name || user?.username || '사용자'}님 환영합니다</span>
            <IconBtn title="로그아웃" onClick={handleLogout}>
              <LogoutOutlined />
            </IconBtn>
          </>
        ) : (
          <Button
            type="primary"
            icon={<LoginOutlined />}
            onClick={() => setIsLoginModalVisible(true)}
          >
            로그인
          </Button>
        )}
        <Button
          icon={<TableOutlined />}
          onClick={() => window.open('/patient-data', '_blank')}
          style={{ marginRight: 8 }}
        >
          환자 데이터 테이블 보기
        </Button>
      </UserMenu>
      <Modal
        title="로그인"
        open={isLoginModalVisible}
        onCancel={() => setIsLoginModalVisible(false)}
        footer={null}
      >
        <Form
          name="login"
          onFinish={handleLogin}
          layout="vertical"
        >
          <Form.Item
            label="이메일"
            name="email"
            rules={[
              { required: true, message: '이메일을 입력해주세요' },
              { type: 'email', message: '올바른 이메일 형식을 입력해주세요' }
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="이메일" />
          </Form.Item>

          <Form.Item
            label="비밀번호"
            name="password"
            rules={[{ required: true, message: '비밀번호를 입력해주세요' }]}
          >
            <Input.Password placeholder="비밀번호" />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              style={{ width: '100%' }}
              loading={loading}
            >
              {loading ? '로그인 중...' : '로그인'}
            </Button>
          </Form.Item>
          <div style={{ textAlign: 'center', color: '#666' }}>
            테스트 계정: admin@test.com / 123456
          </div>
        </Form>
      </Modal>
    </HeaderBar>
  );
};

export default Header;