import React, { useState, useEffect } from 'react';
import { Typography, Card, Space, message, Alert, Spin, Row, Col, Statistic, Progress, Tag } from 'antd';
import { 
  UserOutlined, 
  DesktopOutlined, 
  OrderedListOutlined,
  MedicineBoxOutlined,
  HeartOutlined,
  ClockCircleOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
  StarOutlined
} from '@ant-design/icons';
import styled, { keyframes } from 'styled-components';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import * as queueApi from '../api/queueApi';
import { GlassCard } from '../components/Common/Header';

const { Title, Text, Paragraph } = Typography;

// 애니메이션 정의
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const float = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
`;

const pulse = keyframes`
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
`;

const HomeContainer = styled.div`
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
  min-height: 100vh;
  background: linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%);
`;

const HeroSection = styled.section`
  text-align: center;
  margin-bottom: 60px;
  padding: 80px 40px;
  background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
  border-radius: 24px;
  color: white;
  position: relative;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(30, 64, 175, 0.3);
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
    pointer-events: none;
  }
  
  animation: ${fadeInUp} 1s ease-out;
`;

const HeroTitle = styled(Title)`
  color: white !important;
  margin-bottom: 20px !important;
  font-weight: 900 !important;
  font-size: 56px !important;
  text-shadow: 0 4px 8px rgba(0,0,0,0.3);
  animation: ${float} 3s ease-in-out infinite;
  
  @media (max-width: 768px) {
    font-size: 36px !important;
  }
`;

const HeroSubtitle = styled(Text)`
  color: rgba(255,255,255,0.9) !important;
  font-size: 20px !important;
  font-weight: 300;
  margin-bottom: 30px;
  display: block;
`;

const StatsSection = styled.section`
  margin-bottom: 60px;
  animation: ${fadeInUp} 1s ease-out 0.2s both;
`;

const StatCard = GlassCard;

const FeaturesSection = styled.section`
  margin-bottom: 60px;
  animation: ${fadeInUp} 1s ease-out 0.4s both;
`;

const FeatureCard = GlassCard;

const InfoSection = styled.section`
  margin-bottom: 40px;
  animation: ${fadeInUp} 1s ease-out 0.6s both;
`;

const InfoCard = GlassCard;

const ContactSection = styled.section`
  text-align: center;
  padding: 40px;
  background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
  border-radius: 24px;
  color: white;
  animation: ${fadeInUp} 1s ease-out 0.8s both;
`;

const Home = () => {
  const { isAuthenticated } = useSelector(state => state.auth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalPatients: 0,
    waitingPatients: 0,
    todayAppointments: 0,
    completedToday: 0
  });
  const navigate = useNavigate();

  // 통계 데이터 가져오기
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // 실제 API 호출로 대체 가능
        setStats({
          totalPatients: 1250,
          waitingPatients: 8,
          todayAppointments: 45,
          completedToday: 32
        });
      } catch (error) {
        console.error('통계 데이터 조회 실패:', error);
      }
    };

    fetchStats();
  }, []);

  const handleFeatureClick = (feature) => {
    if (!isAuthenticated) {
      message.warning('로그인이 필요한 기능입니다.');
      return;
    }

    switch (feature) {
      case 'patient':
        navigate('/patient');
        break;
      case 'reception':
        navigate('/reception');
        break;
      case 'waiting':
        navigate('/queue');
        break;
      case 'doctor':
        navigate('/doctor');
        break;
      default:
        break;
    }
  };

  return (
    <HomeContainer>
      {error && (
        <Alert message="오류" description={error} type="error" showIcon style={{ marginBottom: 16 }} />
      )}
      <Spin spinning={loading} tip="불러오는 중...">
        <HeroSection>
          <HeroTitle level={1}>
            <HeartOutlined style={{ marginRight: 16, color: '#ff6b6b' }} />
            Maekstation
          </HeroTitle>
          <HeroSubtitle>
            81맥상 정량 맥진 진단 시스템
          </HeroSubtitle>
          <Paragraph style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16, maxWidth: 600, margin: '0 auto' }}>
            전통 한의학과 현대 기술의 만남으로 건강한 삶을 위한 정확한 진단을 제공합니다
          </Paragraph>
          <Tag color="gold" style={{ marginTop: 20, padding: '8px 16px', fontSize: 14 }}>
            <StarOutlined /> AI 기반 맥진 분석 시스템
          </Tag>
        </HeroSection>

        {/*
          <StatsSection>
            <Row gutter={[24, 24]}>
              <Col xs={24} sm={12} lg={6}>
                <StatCard>
                  <Statistic
                    title="총 환자 수"
                    value={stats.totalPatients}
                    prefix={<UserOutlined />}
                    valueStyle={{ color: '#10B981' }}
                  />
                  <Progress percent={85} showInfo={false} strokeColor="#10B981" />
                </StatCard>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <StatCard>
                  <Statistic
                    title="대기 환자"
                    value={stats.waitingPatients}
                    prefix={<ClockCircleOutlined />}
                    valueStyle={{ color: '#F59E0B' }}
                  />
                  <Progress percent={stats.waitingPatients * 10} showInfo={false} strokeColor="#F59E0B" />
                </StatCard>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <StatCard>
                  <Statistic
                    title="오늘 예약"
                    value={stats.todayAppointments}
                    prefix={<CheckCircleOutlined />}
                    valueStyle={{ color: '#059669' }}
                  />
                  <Progress percent={75} showInfo={false} strokeColor="#059669" />
                </StatCard>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <StatCard>
                  <Statistic
                    title="완료 진료"
                    value={stats.completedToday}
                    prefix={<MedicineBoxOutlined />}
                    valueStyle={{ color: '#047857' }}
                  />
                  <Progress percent={70} showInfo={false} strokeColor="#047857" />
                </StatCard>
              </Col>
            </Row>
          </StatsSection>
        */}

        <FeaturesSection>
          <Row gutter={[32, 32]}>
            <Col xs={24} sm={12} lg={6}>
              <FeatureCard onClick={() => handleFeatureClick('patient')}>
                <div className="feature-icon" style={{
                  fontSize: 40,
                  color: '#1e40af',
                  background: 'rgba(30,64,175,0.12)',
                  borderRadius: '50%',
                  width: 60,
                  height: 60,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px auto',
                  boxShadow: '0 4px 16px rgba(30,64,175,0.12)'
                }}>
                  <UserOutlined />
                </div>
                <Title level={3} className="feature-title">환자 정보입력</Title>
                <Text className="feature-description">
                  환자 기본 정보 및 맥파 데이터 입력
                </Text>
                <ArrowRightOutlined className="feature-arrow" />
              </FeatureCard>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <FeatureCard onClick={() => handleFeatureClick('reception')}>
                <div className="feature-icon" style={{
                  fontSize: 40,
                  color: '#2563eb',
                  background: 'rgba(37,99,235,0.12)',
                  borderRadius: '50%',
                  width: 60,
                  height: 60,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px auto',
                  boxShadow: '0 4px 16px rgba(37,99,235,0.12)'
                }}>
                  <DesktopOutlined />
                </div>
                <Title level={3} className="feature-title">접수실</Title>
                <Text className="feature-description">
                  환자 접수 및 대기열 관리
                </Text>
                <ArrowRightOutlined className="feature-arrow" />
              </FeatureCard>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <FeatureCard onClick={() => handleFeatureClick('waiting')}>
                <div className="feature-icon" style={{
                  fontSize: 40,
                  color: '#3b82f6',
                  background: 'rgba(59,130,246,0.12)',
                  borderRadius: '50%',
                  width: 60,
                  height: 60,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px auto',
                  boxShadow: '0 4px 16px rgba(59,130,246,0.12)'
                }}>
                  <OrderedListOutlined />
                </div>
                <Title level={3} className="feature-title">대기목록</Title>
                <Text className="feature-description">
                  실시간 대기 현황 모니터링
                </Text>
                <ArrowRightOutlined className="feature-arrow" />
              </FeatureCard>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <FeatureCard onClick={() => handleFeatureClick('doctor')}>
                <div className="feature-icon" style={{
                  fontSize: 40,
                  color: '#1d4ed8',
                  background: 'rgba(29,78,216,0.12)',
                  borderRadius: '50%',
                  width: 60,
                  height: 60,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px auto',
                  boxShadow: '0 4px 16px rgba(29,78,216,0.12)'
                }}>
                  <MedicineBoxOutlined />
                </div>
                <Title level={3} className="feature-title">진료실</Title>
                <Text className="feature-description">
                  맥파 분석 및 진료 기록
                </Text>
                <ArrowRightOutlined className="feature-arrow" />
              </FeatureCard>
            </Col>
          </Row>
        </FeaturesSection>

        <InfoSection>
          <Row gutter={[24, 24]}>
            <Col xs={24} md={8}>
              <InfoCard title="진료 시간">
                <ul>
                  <li>평일: 09:00 - 18:00</li>
                  <li>토요일: 09:00 - 13:00</li>
                  <li>일요일 및 공휴일: 휴진</li>
                  <li>점심시간: 12:00 - 13:00</li>
                </ul>
              </InfoCard>
            </Col>

            <Col xs={24} md={8}>
              <InfoCard title="진료 안내">
                <ul>
                  <li>AI 기반 맥진 분석</li>
                  <li>비대면 진료 가능</li>
                  <li>주차 가능 (무료)</li>
                  <li>건강보험 적용</li>
                </ul>
              </InfoCard>
            </Col>

            <Col xs={24} md={8}>
              <InfoCard title="연락처">
                <ul>
                  <li><PhoneOutlined /> 051-612-0120</li>
                  <li><EnvironmentOutlined /> 부산광역시 XX구 XX로 XX</li>
                  <li>이메일: info@maekstation.com</li>
                  <li>카카오톡: @maekstation</li>
                </ul>
              </InfoCard>
            </Col>
          </Row>
        </InfoSection>

        <ContactSection>
          <Title level={2} style={{ color: 'white', marginBottom: 16 }}>
            건강한 삶을 위한 첫걸음
          </Title>
          <Paragraph style={{ color: 'rgba(255,255,255,0.9)', fontSize: 18, marginBottom: 24 }}>
            도원한의원에서 정확한 진단과 치료를 받아보세요
          </Paragraph>
          <Space size="large">
            <Tag color="white" style={{ color: '#1e40af', fontSize: 16, padding: '8px 16px' }}>
              <PhoneOutlined /> 예약 문의
            </Tag>
            <Tag color="white" style={{ color: '#1e40af', fontSize: 16, padding: '8px 16px' }}>
              <EnvironmentOutlined /> 오시는 길
            </Tag>
          </Space>
        </ContactSection>
      </Spin>
    </HomeContainer>
  );
};

export default Home; 