import React, { useState, useEffect } from 'react';
import { Typography, Card, Space, message } from 'antd';
import { 
  UserOutlined, 
  DesktopOutlined, 
  OrderedListOutlined,
  MedicineBoxOutlined 
} from '@ant-design/icons';
import styled from 'styled-components';
import { useSelector } from 'react-redux';
import PatientFormWrapper from '../components/PatientForm/PatientFormWrapper';
import ReceptionDashboard from '../components/ReceptionDashboard/ReceptionDashboard';
import QueueDisplay from '../components/QueueDisplay/QueueDisplay';
import DoctorView from '../components/DoctorView/DoctorView';
import api from '../api/axiosInstance';
import * as queueApi from '../api/queueApi';
import CurrentPatientInfo from '../components/CurrentPatientInfo';

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
  const { isAuthenticated } = useSelector(state => state.auth);
  const [isPatientFormVisible, setIsPatientFormVisible] = useState(false);
  const [isReceptionDashboardVisible, setIsReceptionDashboardVisible] = useState(false);
  const [isQueueDisplayVisible, setIsQueueDisplayVisible] = useState(false);
  const [isDoctorViewVisible, setIsDoctorViewVisible] = useState(false);
  const [queueData, setQueueData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);
  const [isConsulting, setIsConsulting] = useState(false);
  const [currentPatient, setCurrentPatient] = useState(null);

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleFeatureClick = (feature) => {
    if (!isAuthenticated) {
      message.warning('로그인이 필요한 기능입니다.');
      setIsLoginModalVisible(true);
      return;
    }

    switch (feature) {
      case 'patient':
        setIsPatientFormVisible(true);
        break;
      case 'reception':
        setIsReceptionDashboardVisible(true);
        break;
      case 'waiting':
        setIsQueueDisplayVisible(true);
        break;
      case 'doctor':
        setIsDoctorViewVisible(true);
        break;
      default:
        break;
    }
  };

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const response = await queueApi.getTodayQueueList();
      if (response?.data) {
        setQueueData(response.data);
      }
    } catch (error) {
      console.error('❌ 대기 목록 조회 실패:', error);
      message.error('대기 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
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

        <FeatureCard onClick={() => { 
          handleFeatureClick('doctor'); 
        }}>
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
      {isAuthenticated && (
        <>
          {currentPatient
            ? <CurrentPatientInfo patient={currentPatient} />
            : <PatientFormWrapper 
                visible={isPatientFormVisible}
                onClose={() => setIsPatientFormVisible(false)}
                fetchQueue={fetchQueue}
              />}
          <ReceptionDashboard
            visible={isReceptionDashboardVisible}
            onClose={() => setIsReceptionDashboardVisible(false)}
            queueData={queueData}
            loading={loading}
            onQueueUpdate={fetchQueue}
          />
          <QueueDisplay
            visible={isQueueDisplayVisible}
            onClose={() => setIsQueueDisplayVisible(false)}
            queueData={queueData}
            loading={loading}
            onQueueUpdate={fetchQueue}
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