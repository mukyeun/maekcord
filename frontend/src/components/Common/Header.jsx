import React, { useState, useEffect } from 'react';
import { Layout, Button, Space, Typography, Modal, Form, Input, message } from 'antd';
import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';
import { 
  MenuOutlined, 
  UserOutlined, 
  DesktopOutlined, 
  OrderedListOutlined,
  MedicineBoxOutlined,
  LoginOutlined,
  LogoutOutlined 
} from '@ant-design/icons';
import { loginUser, logout } from '../../store/slices/authSlice';
import ReceptionDashboard from '../ReceptionDashboard/ReceptionDashboard';
import QueueDisplay from '../QueueDisplay/QueueDisplay';
import DoctorView from '../DoctorView/DoctorView';

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

const Header = ({ onToggle }) => {
  const dispatch = useDispatch();
  const { isAuthenticated, user, loading } = useSelector((state) => state.auth);
  const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);
  const [isDoctorViewVisible, setIsDoctorViewVisible] = useState(false);
  const [isReceptionDashboardVisible, setIsReceptionDashboardVisible] = useState(false);
  const [isQueueDisplayVisible, setIsQueueDisplayVisible] = useState(false);

  const handleLogin = async (values) => {
    try {
      console.log('로그인 시도:', values); // 디버깅용 로그
      const result = await dispatch(loginUser(values)).unwrap();
      if (result) {
        setIsLoginModalVisible(false);
        message.success('로그인되었습니다.');
      }
    } catch (error) {
      console.error('로그인 실패:', error);
      message.error('아이디 또는 비밀번호가 잘못되었습니다.');
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    message.success('로그아웃되었습니다.');
  };

  return (
    <StyledHeader>
      <Space>
        <ActionButton 
          type="text" 
          icon={<MenuOutlined />} 
          onClick={onToggle}
        />
        <Logo level={4}>Maekstation</Logo>
      </Space>

      <Space>
        {isAuthenticated ? (
          <>
            <ActionButton 
              icon={<MedicineBoxOutlined />}
              onClick={() => setIsDoctorViewVisible(true)}
            >
              진료실
            </ActionButton>
            <ActionButton 
              icon={<OrderedListOutlined />}
              onClick={() => setIsQueueDisplayVisible(true)}
            >
              대기목록
            </ActionButton>
            <ActionButton 
              icon={<DesktopOutlined />}
              onClick={() => setIsReceptionDashboardVisible(true)}
            >
              접수실
            </ActionButton>
            <Space>
              <span style={{ marginRight: '8px' }}>
                {user?.name || user?.username || '사용자'}님 환영합니다
              </span>
              <LoginButton 
                type="primary"
                icon={<LogoutOutlined />}
                onClick={handleLogout}
              >
                로그아웃
              </LoginButton>
            </Space>
          </>
        ) : (
          <LoginButton 
            type="primary"
            icon={<LoginOutlined />}
            onClick={() => setIsLoginModalVisible(true)}
          >
            로그인
          </LoginButton>
        )}
      </Space>

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

      <DoctorView
        visible={isDoctorViewVisible}
        onClose={() => setIsDoctorViewVisible(false)}
      />

      <ReceptionDashboard
        visible={isReceptionDashboardVisible}
        onClose={() => setIsReceptionDashboardVisible(false)}
      />

      <QueueDisplay
        visible={isQueueDisplayVisible}
        onClose={() => setIsQueueDisplayVisible(false)}
      />
    </StyledHeader>
  );
};

export default Header;