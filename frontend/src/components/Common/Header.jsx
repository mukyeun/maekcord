import React, { useState, useEffect } from 'react';
import { Layout, Button, Space, Typography, Modal, Form, Input, message } from 'antd';
import styled from 'styled-components';
import { 
  MenuOutlined, 
  UserOutlined, 
  DesktopOutlined, 
  OrderedListOutlined,
  MedicineBoxOutlined,
  LoginOutlined,
  LogoutOutlined 
} from '@ant-design/icons';
import PatientFormWrapper from '../PatientForm/PatientFormWrapper';
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
  const [isPatientFormVisible, setIsPatientFormVisible] = useState(false);
  const [isReceptionDashboardVisible, setIsReceptionDashboardVisible] = useState(false);
  const [isQueueDisplayVisible, setIsQueueDisplayVisible] = useState(false);
  const [isDoctorViewVisible, setIsDoctorViewVisible] = useState(false);
  const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');

  const handleLogin = async (values) => {
    try {
      // 실제 API 연동 시 이 부분을 수정
      if (values.username === 'maek' && values.password === '1234') {
        setIsLoggedIn(true);
        setUsername(values.username);
        setIsLoginModalVisible(false);
        message.success('로그인되었습니다.');
        
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('username', values.username);
      } else {
        message.error('아이디 또는 비밀번호가 잘못되었습니다.');
      }
    } catch (error) {
      message.error('로그인 중 오류가 발생했습니다.');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername('');
    message.success('로그아웃되었습니다.');
    
    // localStorage에서 로그인 정보 제거
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
  };

  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const savedUsername = localStorage.getItem('username');
    if (loggedIn && savedUsername) {
      setIsLoggedIn(true);
      setUsername(savedUsername);
    }
  }, []);

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
        {isLoggedIn ? (
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
            <ActionButton 
              icon={<UserOutlined />}
              onClick={() => setIsPatientFormVisible(true)}
            >
              환자
            </ActionButton>
            <Space>
              <span style={{ marginRight: '8px' }}>
                {username}님 환영합니다
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
            label="아이디"
            name="username"
            rules={[{ required: true, message: '아이디를 입력해주세요' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="아이디" />
          </Form.Item>

          <Form.Item
            label="비밀번호"
            name="password"
            rules={[{ required: true, message: '비밀번호를 입력해주세요' }]}
          >
            <Input.Password placeholder="비밀번호" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ width: '100%' }}>
              로그인
            </Button>
          </Form.Item>
          <div style={{ textAlign: 'center', color: '#666' }}>
            테스트 계정: maek / 1234
          </div>
        </Form>
      </Modal>

      {/* 모달들은 로그인 상태일 때만 렌더링 */}
      {isLoggedIn && (
        <>
          <PatientFormWrapper 
            visible={isPatientFormVisible}
            onClose={() => setIsPatientFormVisible(false)}
          />
          <ReceptionDashboard
            visible={isReceptionDashboardVisible}
            onClose={() => setIsReceptionDashboardVisible(false)}
          />
          <QueueDisplay
            visible={isQueueDisplayVisible}
            onClose={() => setIsQueueDisplayVisible(false)}
          />
          <DoctorView
            visible={isDoctorViewVisible}
            onClose={() => setIsDoctorViewVisible(false)}
          />
        </>
      )}
    </StyledHeader>
  );
};

export default Header;