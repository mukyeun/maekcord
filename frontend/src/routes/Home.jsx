import React, { useState, useEffect } from 'react';
import { Typography, Card, Space, message } from 'antd';
import { 
  UserOutlined, 
  DesktopOutlined, 
  OrderedListOutlined,
  MedicineBoxOutlined 
} from '@ant-design/icons';
import styled from 'styled-components';
import PatientFormWrapper from '../components/PatientForm/PatientFormWrapper';
import ReceptionDashboard from '../components/ReceptionDashboard/ReceptionDashboard';
import QueueDisplay from '../components/QueueDisplay/QueueDisplay';
import DoctorView from '../components/DoctorView/DoctorView';
import api from '../api/axiosInstance';

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
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
  margin-bottom: 48px;
`;

const FeatureCard = styled(Card)`
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .ant-card-body {
    padding: 24px;
  }

  .feature-icon {
    font-size: 32px;
    color: #1890ff;
    margin-bottom: 16px;
  }

  .feature-title {
    margin-bottom: 12px;
    color: #262626;
  }

  .feature-description {
    color: #595959;
    margin-bottom: 16px;
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
  const [isPatientFormVisible, setIsPatientFormVisible] = useState(false);
  const [isReceptionDashboardVisible, setIsReceptionDashboardVisible] = useState(false);
  const [isQueueDisplayVisible, setIsQueueDisplayVisible] = useState(false);
  const [isDoctorViewVisible, setIsDoctorViewVisible] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [queueData, setQueueData] = useState([]);

  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    setIsLoggedIn(loggedIn);

    // 로그인 상태 변화 감지
    const handleStorageChange = () => {
      const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
      setIsLoggedIn(loggedIn);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleFeatureClick = (feature, setVisible) => {
    if (!isLoggedIn) {
      message.warning('로그인이 필요한 서비스입니다.');
      return;
    }
    setVisible(true);
  };

  const fetchQueue = async () => {
    try {
      console.log('🔄 대기 목록 조회 시작');
      const response = await api.get('/api/queue');
      console.log('✅ 대기 목록 조회 완료:', response.data);
      setQueueData(response.data);
    } catch (error) {
      console.error('❌ 대기 목록 조회 실패:', error);
      message.error('대기 목록 조회에 실패했습니다.');
    }
  };

  return (
    <HomeContainer>
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
        <FeatureCard onClick={() => handleFeatureClick('patient', setIsPatientFormVisible)}>
          <div className="feature-icon">
            <UserOutlined />
          </div>
          <Title level={3} className="feature-title">환자</Title>
          <Text className="feature-description">
            환자 정보 입력 및 관리
          </Text>
        </FeatureCard>

        <FeatureCard onClick={() => handleFeatureClick('reception', setIsReceptionDashboardVisible)}>
          <div className="feature-icon">
            <DesktopOutlined />
          </div>
          <Title level={3} className="feature-title">접수실</Title>
          <Text className="feature-description">
            환자 접수 및 대기 관리
          </Text>
        </FeatureCard>

        <FeatureCard onClick={() => handleFeatureClick('queue', setIsQueueDisplayVisible)}>
          <div className="feature-icon">
            <OrderedListOutlined />
          </div>
          <Title level={3} className="feature-title">대기목록</Title>
          <Text className="feature-description">
            실시간 대기 현황 확인
          </Text>
        </FeatureCard>

        <FeatureCard onClick={() => handleFeatureClick('doctor', setIsDoctorViewVisible)}>
          <div className="feature-icon">
            <MedicineBoxOutlined />
          </div>
          <Title level={3} className="feature-title">진료실</Title>
          <Text className="feature-description">
            진료 기록 및 관리
          </Text>
        </FeatureCard>
      </FeaturesSection>

      {/* 모달 컴포넌트들은 로그인 상태일 때만 렌더링 */}
      {isLoggedIn && (
        <>
          <PatientFormWrapper 
            visible={isPatientFormVisible}
            onClose={() => setIsPatientFormVisible(false)}
            onSuccess={fetchQueue}
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
            <li>전화: 02-XXX-XXXX</li>
            <li>주소: XX시 XX구 XX로 XX</li>
            <li>이메일: info@uhealthcare.com</li>
          </ul>
        </InfoCard>
      </InfoSection>
    </HomeContainer>
  );
};

export default Home; 