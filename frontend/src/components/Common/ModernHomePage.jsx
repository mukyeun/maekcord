import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import {
  Search as SearchIcon,
  Add as AddIcon,
  People as PeopleIcon,
  LocalHospital as HospitalIcon,
  EventNote as EventIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingIcon,
  Notifications as NotificationIcon
} from '@mui/icons-material';

// 애니메이션 정의
const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const slideInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// 스타일드 컴포넌트
const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow-x: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    animation: ${float} 6s ease-in-out infinite;
  }
`;

const ContentWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  position: relative;
  z-index: 1;
  
  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const HeroSection = styled.section`
  text-align: center;
  padding: 60px 0;
  color: white;
  animation: ${slideInUp} 0.8s ease-out;
  
  @media (max-width: 768px) {
    padding: 40px 0;
  }
`;

const Logo = styled.div`
  font-size: 3rem;
  font-weight: 900;
  margin-bottom: 16px;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  letter-spacing: -2px;
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  opacity: 0.9;
  margin-bottom: 32px;
  font-weight: 300;
  
  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const SearchSection = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 40px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  animation: ${slideInUp} 0.8s ease-out 0.2s both;
`;

const SearchInput = styled.div`
  position: relative;
  max-width: 600px;
  margin: 0 auto;
  
  input {
    width: 100%;
    padding: 16px 20px 16px 50px;
    border: none;
    border-radius: 50px;
    background: rgba(255, 255, 255, 0.9);
    font-size: 1rem;
    outline: none;
    transition: all 0.3s ease;
    
    &:focus {
      background: white;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }
    
    &::placeholder {
      color: #666;
    }
  }
  
  svg {
    position: absolute;
    left: 20px;
    top: 50%;
    transform: translateY(-50%);
    color: #666;
    font-size: 1.2rem;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
  animation: ${slideInUp} 0.8s ease-out 0.4s both;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
`;

const StatCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-4px);
    background: rgba(255, 255, 255, 0.15);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
  }
  
  .stat-value {
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 8px;
  }
  
  .stat-label {
    font-size: 0.9rem;
    opacity: 0.8;
  }
  
  .stat-icon {
    font-size: 2rem;
    margin-bottom: 12px;
    opacity: 0.8;
  }
`;

const ActionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  animation: ${slideInUp} 0.8s ease-out 0.6s both;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
`;

const ActionCard = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 32px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, ${props => props.color}20 0%, ${props => props.color}10 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    
    &::before {
      opacity: 1;
    }
    
    .action-icon {
      animation: ${pulse} 0.6s ease-in-out;
    }
  }
  
  &:active {
    transform: translateY(-4px);
  }
  
  .action-icon {
    font-size: 3rem;
    margin-bottom: 16px;
    color: ${props => props.color};
  }
  
  .action-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 8px;
    color: #333;
  }
  
  .action-description {
    font-size: 0.9rem;
    color: #666;
    line-height: 1.5;
  }
`;

const QuickActions = styled.div`
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-top: 32px;
  flex-wrap: wrap;
  animation: ${slideInUp} 0.8s ease-out 0.8s both;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
  }
`;

const QuickButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 12px 24px;
  border-radius: 50px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const ModernHomePage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    waiting: 0,
    appointments: 0,
    inProgress: 0,
    newPatients: 0
  });

  // 통계 데이터 시뮬레이션
  useEffect(() => {
    const interval = setInterval(() => {
      setStats({
        waiting: Math.floor(Math.random() * 20) + 5,
        appointments: Math.floor(Math.random() * 15) + 8,
        inProgress: Math.floor(Math.random() * 10) + 3,
        newPatients: Math.floor(Math.random() * 8) + 2
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const actions = useMemo(() => [
    {
      title: '접수실',
      description: '환자 접수 및 대기열 관리',
      icon: AssignmentIcon,
      color: '#4CAF50',
      path: '/reception'
    },
    {
      title: '환자 등록',
      description: '새로운 환자 정보 입력',
      icon: AddIcon,
      color: '#2196F3',
      path: '/patient/new'
    },
    {
      title: '대기목록',
      description: '실시간 대기 환자 확인',
      icon: PeopleIcon,
      color: '#FF9800',
      path: '/queue'
    },
    {
      title: '진료실',
      description: '의사 진료 화면',
      icon: HospitalIcon,
      color: '#9C27B0',
      path: '/doctor'
    },
    {
      title: '예약 관리',
      description: '환자 예약 일정 관리',
      icon: EventIcon,
      color: '#F44336',
      path: '/appointments'
    },
    {
      title: '환자 데이터',
      description: '환자 정보 조회 및 관리',
      icon: TrendingIcon,
      color: '#607D8B',
      path: '/patient-data'
    }
  ], []);

  const handleActionClick = (path) => {
    navigate(path);
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      // 검색 로직 구현
      console.log('Searching for:', searchQuery);
    }
  };

  return (
    <PageContainer>
      <ContentWrapper>
        <HeroSection>
          <Logo>Maekcord</Logo>
          <Subtitle>
            AI 기반 맥진 진단 시스템으로 정확하고 빠른 진료를 제공합니다
          </Subtitle>
        </HeroSection>

        <SearchSection>
          <SearchInput>
            <SearchIcon />
            <input
              type="text"
              placeholder="환자명, ID 또는 증상으로 검색하세요..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleSearch}
            />
          </SearchInput>
        </SearchSection>

        <StatsGrid>
          <StatCard>
            <div className="stat-icon">⏳</div>
            <div className="stat-value">{stats.waiting}</div>
            <div className="stat-label">대기 중</div>
          </StatCard>
          <StatCard>
            <div className="stat-icon">📅</div>
            <div className="stat-value">{stats.appointments}</div>
            <div className="stat-label">오늘 예약</div>
          </StatCard>
          <StatCard>
            <div className="stat-icon">🏥</div>
            <div className="stat-value">{stats.inProgress}</div>
            <div className="stat-label">진료 중</div>
          </StatCard>
          <StatCard>
            <div className="stat-icon">👤</div>
            <div className="stat-value">{stats.newPatients}</div>
            <div className="stat-label">신규 환자</div>
          </StatCard>
        </StatsGrid>

        <ActionsGrid>
          {actions.map((action, index) => (
            <ActionCard
              key={action.title}
              color={action.color}
              onClick={() => handleActionClick(action.path)}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleActionClick(action.path);
                }
              }}
            >
              <div className="action-icon">
                <action.icon />
              </div>
              <div className="action-title">{action.title}</div>
              <div className="action-description">{action.description}</div>
            </ActionCard>
          ))}
        </ActionsGrid>

        <QuickActions>
          <QuickButton onClick={() => navigate('/reception')}>
            빠른 접수
          </QuickButton>
          <QuickButton onClick={() => navigate('/queue')}>
            대기열 보기
          </QuickButton>
          <QuickButton onClick={() => navigate('/patient/new')}>
            환자 등록
          </QuickButton>
        </QuickActions>
      </ContentWrapper>
    </PageContainer>
  );
};

export default ModernHomePage; 