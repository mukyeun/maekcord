import React, { useState, useEffect } from 'react';
import { Typography, Card, Space, message, Alert, Spin } from 'antd';
import { 
  UserOutlined, 
  DesktopOutlined, 
  OrderedListOutlined,
  MedicineBoxOutlined 
} from '@ant-design/icons';
import styled from 'styled-components';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import * as queueApi from '../api/queueApi';

const { Title, Text } = Typography;

const HomeContainer = styled.div`
  padding: 40px;
  max-width: 1200px;
  margin: 0 auto;
`;

const HeroSection = styled.section`
  text-align: center;
  margin-bottom: 48px;
  padding: 48px 0;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  border-radius: 16px;
  color: white;
`;

const FeaturesSection = styled.section`
  display: flex;
  gap: 32px;
  justify-content: center;
  margin-bottom: 48px;
  flex-wrap: wrap;
`;

const FeatureCard = styled(Card)`
  width: 220px;
  min-height: 160px;
  border-radius: 18px;
  box-shadow: 0 4px 24px rgba(24, 144, 255, 0.08);
  transition: box-shadow 0.2s, transform 0.2s;
  cursor: pointer;
  text-align: center;
  &:hover {
    box-shadow: 0 8px 32px rgba(24, 144, 255, 0.18);
    transform: translateY(-6px) scale(1.03);
    border-color: #1890ff;
  }
  .feature-icon {
    font-size: 38px;
    color: #1890ff;
    margin-bottom: 18px;
  }
  .feature-title {
    font-weight: 700;
    font-size: 20px;
    margin-bottom: 10px;
  }
  .feature-description {
    color: #888;
    font-size: 15px;
  }
`;

const InfoSection = styled.section`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  background: #f5f5f5;
  padding: 32px;
  border-radius: 16px;
`;

const InfoCard = styled(Card)`
  .ant-card-head {
    border-bottom: none;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  li {
    margin-bottom: 8px;
    color: #595959;
  }
`;

const Home = () => {
  const { isAuthenticated } = useSelector(state => state.auth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

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
          <Title level={1} style={{ 
            color: 'white', 
            marginBottom: 16, 
            fontWeight: 800, 
            fontSize: '48px' 
          }}>
            Maekstation
          </Title>
          <Text style={{ color: 'white', fontSize: 18 }}>
            건강한 삶을 위한 첫걸음
          </Text>
        </HeroSection>

        <FeaturesSection>
          <FeatureCard onClick={() => handleFeatureClick('patient')}>
            <div className="feature-icon">
              <UserOutlined />
            </div>
            <Title level={3} className="feature-title">환자 정보입력</Title>
            <Text className="feature-description">
              환자 정보 입력 및 관리
            </Text>
          </FeatureCard>

          <FeatureCard onClick={() => handleFeatureClick('reception')}>
            <div className="feature-icon">
              <DesktopOutlined />
            </div>
            <Title level={3} className="feature-title">접수실</Title>
            <Text className="feature-description">
              환자 접수 및 대기 관리
            </Text>
          </FeatureCard>

          <FeatureCard onClick={() => handleFeatureClick('waiting')}>
            <div className="feature-icon">
              <OrderedListOutlined />
            </div>
            <Title level={3} className="feature-title">대기목록</Title>
            <Text className="feature-description">
              실시간 대기 현황 확인
            </Text>
          </FeatureCard>

          <FeatureCard onClick={() => handleFeatureClick('doctor')}>
            <div className="feature-icon">
              <MedicineBoxOutlined />
            </div>
            <Title level={3} className="feature-title">진료실</Title>
            <Text className="feature-description">
              진료 기록 및 관리
            </Text>
          </FeatureCard>
        </FeaturesSection>

        <InfoSection>
          <InfoCard title="진료 시간">
            <ul>
              <li>평일: 09:00 - 18:00</li>
              <li>토요일: 09:00 - 13:00</li>
              <li>일요일 및 공휴일: 휴진</li>
            </ul>
          </InfoCard>

          <InfoCard title="진료 안내">
            <ul>
              <li>비대면 진료 가능</li>
              <li>주차 가능</li>
              <li>건강보험 적용</li>
            </ul>
          </InfoCard>

          <InfoCard title="연락처">
            <ul>
              <li>전화: 051-612-0120</li>
              <li>주소: 부산광역시 XX구 XX로 XX</li>
              <li>이메일: info@maekstation.com</li>
            </ul>
          </InfoCard>
        </InfoSection>
      </Spin>
    </HomeContainer>
  );
};

export default Home; 