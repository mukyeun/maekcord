import React from 'react';
import { Card, Row, Col, Statistic, Button, Typography } from 'antd';
import { UserOutlined, ClockCircleOutlined, CalendarOutlined, BarChartOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

const DashboardPage = () => {
  const navigate = useNavigate();

  const menuItems = [
    {
      title: '환자 등록',
      icon: <UserOutlined style={{ fontSize: 32, color: '#1890ff' }} />,
      description: '새로운 환자 정보를 등록합니다',
      path: '/patient-form',
      color: '#1890ff'
    },
    {
      title: '대기열 관리',
      icon: <ClockCircleOutlined style={{ fontSize: 32, color: '#52c41a' }} />,
      description: '대기열을 확인하고 관리합니다',
      path: '/queue-display',
      color: '#52c41a'
    },
    {
      title: '예약 관리',
      icon: <CalendarOutlined style={{ fontSize: 32, color: '#fa8c16' }} />,
      description: '환자 예약을 관리합니다',
      path: '/appointments',
      color: '#fa8c16'
    },
    {
      title: '환자 데이터',
      icon: <BarChartOutlined style={{ fontSize: 32, color: '#722ed1' }} />,
      description: '환자 데이터를 조회하고 관리합니다',
      path: '/patient-data',
      color: '#722ed1'
    }
  ];

  return (
    <div style={{ padding: '24px', minHeight: '100vh' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <Title level={1}>맥진 진단 시스템</Title>
        <p style={{ color: '#666', fontSize: 16 }}>대시보드</p>
      </div>

      {/* 통계 카드 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="오늘 환자"
              value={15}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="대기 중"
              value={8}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="진료 완료"
              value={7}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="예약"
              value={12}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 메뉴 카드 */}
      <Row gutter={[16, 16]}>
        {menuItems.map((item, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card
              hoverable
              style={{ 
                textAlign: 'center',
                cursor: 'pointer',
                borderRadius: 12
              }}
              onClick={() => navigate(item.path)}
            >
              <div style={{ marginBottom: 16 }}>
                {item.icon}
              </div>
              <Title level={4} style={{ color: item.color, marginBottom: 8 }}>
                {item.title}
              </Title>
              <p style={{ color: '#666', fontSize: 14 }}>
                {item.description}
              </p>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 빠른 액션 버튼 */}
      <div style={{ marginTop: 32, textAlign: 'center' }}>
        <Button 
          type="primary" 
          size="large"
          onClick={() => navigate('/patient-form')}
          style={{ marginRight: 16 }}
        >
          환자 등록
        </Button>
        <Button 
          size="large"
          onClick={() => navigate('/queue-display')}
        >
          대기열 보기
        </Button>
      </div>
    </div>
  );
};

export default DashboardPage; 