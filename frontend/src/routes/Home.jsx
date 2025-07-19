import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Grid, Card, TextField, InputAdornment, Avatar, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import TodayIcon from '@mui/icons-material/Today';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PeopleIcon from '@mui/icons-material/People';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import EventNoteIcon from '@mui/icons-material/EventNote';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import AppointmentManagerModal from '../components/appointments/AppointmentManagerModal';
import { searchPatient } from '../api/patientApi';
import axiosInstance from '../api/axiosInstance';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

const mainActions = [
  { label: '신규 환자 등록', icon: <AddCircleOutlineIcon />, to: '/patient/new', color: 'primary' },
  { label: '오늘 대기 보기', icon: <PeopleIcon />, to: '/queue', color: 'secondary' },
];

export default function Home() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(state => state.auth.isAuthenticated);
  const [search, setSearch] = React.useState('');
  const [candidates, setCandidates] = React.useState([]);
  const [showCandidates, setShowCandidates] = React.useState(false);
  const [openAppointmentModal, setOpenAppointmentModal] = useState(false);
  const searchTimeoutRef = useRef(null);
  const isInitializedRef = useRef(false);

  // 대시보드 요약 상태로 변경
  const [dashboardSummary, setDashboardSummary] = React.useState([
    { label: '오늘의 대기', value: 0, icon: <PeopleIcon color="primary" /> },
    { label: '예약', value: 0, icon: <TodayIcon color="success" /> },
    { label: '진료중', value: 0, icon: <LocalHospitalIcon color="error" /> },
    { label: '신규환자', value: 0, icon: <PersonAddIcon color="info" /> },
  ]);

  // 대시보드 요약 API 호출 (한 번만 실행)
  useEffect(() => {
    if (!isInitializedRef.current) {
      console.log('Home 컴포넌트 초기화...');
      isInitializedRef.current = true;
      
      // 임시로 기본값 사용 (API 구현 전까지)
      setDashboardSummary([
        { label: '오늘의 대기', value: 0, icon: <PeopleIcon color="primary" /> },
        { label: '예약', value: 0, icon: <TodayIcon color="success" /> },
        { label: '진료중', value: 0, icon: <LocalHospitalIcon color="error" /> },
        { label: '신규환자', value: 0, icon: <PersonAddIcon color="info" /> },
      ]);
    }
  }, []);

  // 검색 로직 개선 (디바운스 적용)
  useEffect(() => {
    if (search.trim()) {
      // 이전 타이머 클리어
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      const searchPatients = async () => {
        try {
          const result = await searchPatient({ 
            search: search.trim(),
            limit: 10,
            page: 1
          });
          
          if (result.success) {
            // 백엔드 응답 구조에 맞게 수정
            const patients = result.patients || result.data?.patients || result.data || [];
            setCandidates(patients);
            setShowCandidates(true);
          } else {
            console.error('검색 실패:', result.message);
            setCandidates([]);
            setShowCandidates(true);
          }
        } catch (error) {
          console.error('환자 검색 API 오류:', error);
          setCandidates([]);
          setShowCandidates(true);
        }
      };

      // 디바운스 적용 (500ms)
      searchTimeoutRef.current = setTimeout(searchPatients, 500);
    } else {
      setCandidates([]);
      setShowCandidates(false);
    }

    // 클린업 함수
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [search]);

  const handleCandidateClick = useCallback((patient) => {
    navigate(`/doctor?patientId=${patient._id}`);
    setSearch('');
    setShowCandidates(false);
  }, [navigate]);

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/search?query=${encodeURIComponent(search)}`);
      setShowCandidates(false);
    }
  }, [navigate, search]);

  // 메모이제이션된 컴포넌트들
  const searchBar = useMemo(() => (
    <TextField
      fullWidth
      variant="outlined"
      placeholder="환자 이름, 연락처, 주민번호 등으로 검색하세요"
      value={search}
      onChange={e => setSearch(e.target.value)}
      onKeyDown={e => {
        // 엔터키로 form submit 막기 (드롭다운만 동작)
        if (e.key === 'Enter') {
          e.preventDefault();
        }
      }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon />
          </InputAdornment>
        ),
      }}
      autoComplete="off"
      sx={{
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden'
      }}
    />
  ), [search]);

  const dashboardCards = useMemo(() => (
    <Grid container spacing={2} mb={3}>
      {dashboardSummary.map((item, idx) => (
        <Grid key={item.label} item xs={12} sm={6} lg={3}>
          <Card sx={{ 
            p: 2, 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2, 
            boxShadow: 4, 
            borderRadius: 3, 
            bgcolor: '#fff',
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden'
          }}>
            {item.icon}
            <Box>
              <Typography variant="h6" fontWeight={700}>{item.value}</Typography>
              <Typography variant="body2" color="text.secondary">{item.label}</Typography>
            </Box>
          </Card>
        </Grid>
      ))}
    </Grid>
  ), [dashboardSummary]);

  const actionButtons = useMemo(() => (
    mainActions.map(action => (
      <Button
        key={action.label}
        variant="contained"
        color={action.color}
        startIcon={action.icon}
        sx={{ 
          height: 56, 
          minWidth: 160, 
          fontWeight: 600, 
          borderRadius: 2, 
          boxShadow: 2,
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden'
        }}
        onClick={() => navigate(action.to)}
      >
        {action.label}
      </Button>
    ))
  ), [navigate]);

  const searchResults = useMemo(() => {
    if (!showCandidates) return null;
    
    return (
      <Box sx={{
        position: 'absolute', 
        left: 0, 
        right: 0, 
        top: 56, 
        zIndex: 10,
        bgcolor: '#fff', 
        boxShadow: 3, 
        borderRadius: 2, 
        maxHeight: 300, 
        overflowY: 'auto',
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden'
      }}>
        {candidates.length > 0 ? (
          candidates.map(patient => (
            <Box
              key={patient._id}
              sx={{ 
                px: 2, 
                py: 1, 
                cursor: 'pointer', 
                '&:hover': { bgcolor: '#f0f4ff' },
                transform: 'translateZ(0)',
                backfaceVisibility: 'hidden'
              }}
              onClick={() => handleCandidateClick(patient)}
            >
              <Typography fontWeight={700}>{patient.basicInfo?.name}</Typography>
              <Typography variant="body2" color="text.secondary">{patient.basicInfo?.phone}</Typography>
            </Box>
          ))
        ) : (
          <Typography sx={{ px: 2, py: 2, color: 'gray' }}>
            검색 결과가 없습니다.
          </Typography>
        )}
      </Box>
    );
  }, [showCandidates, candidates, handleCandidateClick]);

  console.log('Home 컴포넌트 렌더링...');

  return (
    <Box sx={{ 
      bgcolor: '#f5f7fa', 
      minHeight: '100vh',
      transform: 'translateZ(0)',
      backfaceVisibility: 'hidden'
    }}>
      <Box sx={{ 
        maxWidth: 1200, 
        mx: 'auto', 
        pt: 4, 
        px: 2,
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden'
      }}>
        {/* Hero Header Section */}
        <Box
          sx={{
            width: '100%',
            background: 'linear-gradient(135deg, #1976D2 0%, #42A5F5 50%, #1565C0 100%)',
            color: '#fff',
            py: { xs: 6, md: 8 },
            px: 2,
            mb: 4,
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 3,
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
              opacity: 0.3,
            }
          }}
        >
          <Box sx={{ 
            maxWidth: 1200, 
            mx: 'auto', 
            position: 'relative', 
            zIndex: 1,
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden'
          }}>
            {/* Logo and Main Title */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              mb: 3,
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden'
            }}>
              <Box 
                sx={{ 
                  width: 64, 
                  height: 64, 
                  marginRight: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #1976D2 0%, #42A5F5 100%)',
                  boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                  border: '2px solid rgba(255,255,255,0.2)',
                  transform: 'translateZ(0)',
                  backfaceVisibility: 'hidden'
                }}
              >
                <svg 
                  width="36" 
                  height="36" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
                >
                  {/* 심장 모양 */}
                  <path 
                    d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" 
                    fill="white"
                  />
                  {/* 맥파 곡선 */}
                  <path 
                    d="M4 12c0-2 1.5-3.5 3.5-3.5s3.5 1.5 3.5 3.5" 
                    stroke="white" 
                    strokeWidth="1.5" 
                    fill="none"
                    strokeLinecap="round"
                    opacity="0.8"
                  />
                  <path 
                    d="M13 12c0-2 1.5-3.5 3.5-3.5s3.5 1.5 3.5 3.5" 
                    stroke="white" 
                    strokeWidth="1.5" 
                    fill="none"
                    strokeLinecap="round"
                    opacity="0.8"
                  />
                </svg>
              </Box>
              <Box sx={{ 
                textAlign: 'left',
                transform: 'translateZ(0)',
                backfaceVisibility: 'hidden'
              }}>
                <Typography 
                  variant="h2" 
                  fontWeight={900} 
                  sx={{ 
                    letterSpacing: 3,
                    textShadow: '0 4px 8px rgba(0,0,0,0.3)',
                    mb: 1,
                    transform: 'translateZ(0)',
                    backfaceVisibility: 'hidden'
                  }}
                >
                  Maekcode
                </Typography>
                <Typography 
                  variant="h5" 
                  fontWeight={600} 
                  sx={{ 
                    letterSpacing: 2,
                    opacity: 0.95,
                    textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    fontFamily: 'monospace',
                    transform: 'translateZ(0)',
                    backfaceVisibility: 'hidden'
                  }}
                >
                  81Pulse AI Analysis System
                </Typography>
              </Box>
            </Box>
            
            {/* Description */}
            <Typography 
              variant="body1" 
              sx={{ 
                opacity: 0.85, 
                maxWidth: 600, 
                mx: 'auto',
                lineHeight: 1.6,
                textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                transform: 'translateZ(0)',
                backfaceVisibility: 'hidden'
              }}
            >
              전통 맥진과 현대 AI 기술의 결합으로 정확하고 빠른 진단을 제공합니다.
              실시간 환자 모니터링과 스마트 진료 관리를 통해 의료진과 환자 모두를 위한 
              혁신적인 의료 플랫폼입니다.
            </Typography>
            
            {/* Feature Highlights */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              gap: 4, 
              mt: 4,
              flexWrap: 'wrap',
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%', 
                  bgcolor: '#4CAF50',
                  boxShadow: '0 2px 4px rgba(76,175,80,0.3)'
                }} />
                <Typography variant="body2" sx={{ opacity: 0.9 }}>AI 맥진 분석</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%', 
                  bgcolor: '#FF9800',
                  boxShadow: '0 2px 4px rgba(255,152,0,0.3)'
                }} />
                <Typography variant="body2" sx={{ opacity: 0.9 }}>실시간 모니터링</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%', 
                  bgcolor: '#9C27B0',
                  boxShadow: '0 2px 4px rgba(156,39,176,0.3)'
                }} />
                <Typography variant="body2" sx={{ opacity: 0.9 }}>스마트 진료 관리</Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* 대시보드 요약 카드 */}
        {dashboardCards}

        {/* 검색창 + CTA */}
        <Box sx={{ 
          display: 'flex', 
          gap: 2, 
          alignItems: 'center', 
          mb: 4, 
          flexWrap: 'wrap',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden'
        }}>
          <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
            {searchBar}
            {searchResults}
          </div>
          {actionButtons}
        </Box>

        {/* 주요 기능 카드 (3x2 그리드, 카드 크기 2배, 색상/순서/아이콘 변경) */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
            gap: 4,
            mb: 6,
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden'
          }}
        >
          {/* 접수실 */}
          <Button
            variant="contained"
            onClick={() => navigate('/reception')}
            sx={{
              minHeight: 180,
              fontSize: '2rem',
              bgcolor: '#4CAF50',
              color: '#fff',
              fontWeight: 700,
              borderRadius: 4,
              boxShadow: 4,
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              '&:hover': { bgcolor: '#388E3C' },
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden'
            }}
            fullWidth
          >
            <AssignmentIndIcon sx={{ fontSize: 56, mb: 2 }} />
            접수실
          </Button>
          {/* 환자 정보입력 */}
          <Button
            variant="contained"
            onClick={() => navigate('/patient/new')}
            sx={{
              minHeight: 180,
              fontSize: '2rem',
              bgcolor: '#1976D2',
              color: '#fff',
              fontWeight: 700,
              borderRadius: 4,
              boxShadow: 4,
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              '&:hover': { bgcolor: '#1565C0' },
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden'
            }}
            fullWidth
          >
            <PersonAddIcon sx={{ fontSize: 56, mb: 2 }} />
            환자 정보입력
          </Button>
          {/* 대기목록 */}
          <Button
            variant="contained"
            onClick={() => navigate('/queue')}
            sx={{
              minHeight: 180,
              fontSize: '2rem',
              bgcolor: '#29B6F6',
              color: '#fff',
              fontWeight: 700,
              borderRadius: 4,
              boxShadow: 4,
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              '&:hover': { bgcolor: '#0288D1' },
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden'
            }}
            fullWidth
          >
            <PeopleIcon sx={{ fontSize: 56, mb: 2 }} />
            대기목록
          </Button>
          {/* 진료실 */}
          <Button
            variant="contained"
            onClick={() => navigate('/doctor')}
            sx={{
              minHeight: 180,
              fontSize: '2rem',
              bgcolor: '#9C27B0',
              color: '#fff',
              fontWeight: 700,
              borderRadius: 4,
              boxShadow: 4,
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              '&:hover': { bgcolor: '#7B1FA2' },
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden'
            }}
            fullWidth
          >
            <LocalHospitalIcon sx={{ fontSize: 56, mb: 2 }} />
            진료실
          </Button>
          {/* 예약 */}
          <Button
            variant="contained"
            onClick={() => setOpenAppointmentModal(true)}
            sx={{
              minHeight: 180,
              fontSize: '2rem',
              bgcolor: '#FFA000',
              color: '#fff',
              fontWeight: 700,
              borderRadius: 4,
              boxShadow: 4,
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              '&:hover': { bgcolor: '#FF6F00' },
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden'
            }}
            fullWidth
          >
            <EventNoteIcon sx={{ fontSize: 56, mb: 2 }} />
            예약
          </Button>
          {/* 환자 데이터 */}
          <Button
            variant="contained"
            onClick={() => navigate('/patient-data')}
            sx={{
              minHeight: 180,
              fontSize: '2rem',
              bgcolor: '#37474F',
              color: '#fff',
              fontWeight: 700,
              borderRadius: 4,
              boxShadow: 4,
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              '&:hover': { bgcolor: '#263238' },
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden'
            }}
            fullWidth
          >
            <AssignmentIndIcon sx={{ fontSize: 56, mb: 2 }} />
            환자 데이터
          </Button>
        </Box>

        {/* 대기/접수/진료 등 실시간 요약 대시보드 (예시) */}
        {/* 하단 정보 - 세련된 디자인 */}
        <Box sx={{ mt: 8, mb: 4 }}>
          {/* 섹션 제목 */}
          <Typography 
            variant="h4" 
            fontWeight={700} 
            textAlign="center" 
            sx={{ 
              mb: 4, 
              color: '#1976D2',
              position: 'relative',
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: -8,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 60,
                height: 3,
                background: 'linear-gradient(90deg, #1976D2, #42A5F5)',
                borderRadius: 2
              }
            }}
          >
            진료 안내
          </Typography>
          
          {/* 정보 카드 그리드 */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' },
              gap: 4,
              maxWidth: 1200,
              mx: 'auto',
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden'
            }}
          >
            {/* 진료 시간 */}
            <Card 
              sx={{ 
                p: 4, 
                bgcolor: '#fff', 
                borderRadius: 4, 
                boxShadow: '0 8px 32px rgba(25, 118, 210, 0.1)',
                border: '1px solid rgba(25, 118, 210, 0.1)',
                transition: 'all 0.3s ease',
                transform: 'translateZ(0)',
                backfaceVisibility: 'hidden',
                '&:hover': {
                  transform: 'translateY(-4px) translateZ(0)',
                  boxShadow: '0 12px 40px rgba(25, 118, 210, 0.15)',
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Box 
                  sx={{ 
                    width: 48, 
                    height: 48, 
                    borderRadius: '50%', 
                    bgcolor: '#4CAF50',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 2,
                    boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)'
                  }}
                >
                  <TodayIcon sx={{ color: 'white', fontSize: 24 }} />
                </Box>
                <Typography variant="h6" fontWeight={700} color="#1976D2">
                  진료 시간
                </Typography>
              </Box>
              <Box sx={{ space: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                  <Typography variant="body1" fontWeight={600}>평일</Typography>
                  <Typography variant="body1" color="text.secondary">09:00 ~ 18:00</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                  <Typography variant="body1" fontWeight={600}>토요일</Typography>
                  <Typography variant="body1" color="text.secondary">09:00 ~ 13:00</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: '#fff3e0', borderRadius: 2 }}>
                  <Typography variant="body1" fontWeight={600} color="#FF9800">점심시간</Typography>
                  <Typography variant="body1" color="#FF9800">12:00 ~ 13:00</Typography>
                </Box>
              </Box>
            </Card>

            {/* 진료 안내 */}
            <Card 
              sx={{ 
                p: 4, 
                bgcolor: '#fff', 
                borderRadius: 4, 
                boxShadow: '0 8px 32px rgba(25, 118, 210, 0.1)',
                border: '1px solid rgba(25, 118, 210, 0.1)',
                transition: 'all 0.3s ease',
                transform: 'translateZ(0)',
                backfaceVisibility: 'hidden',
                '&:hover': {
                  transform: 'translateY(-4px) translateZ(0)',
                  boxShadow: '0 12px 40px rgba(25, 118, 210, 0.15)',
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Box 
                  sx={{ 
                    width: 48, 
                    height: 48, 
                    borderRadius: '50%', 
                    bgcolor: '#9C27B0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 2,
                    boxShadow: '0 4px 12px rgba(156, 39, 176, 0.3)'
                  }}
                >
                  <LocalHospitalIcon sx={{ color: 'white', fontSize: 24 }} />
                </Box>
                <Typography variant="h6" fontWeight={700} color="#1976D2">
                  진료 안내
                </Typography>
              </Box>
              <Box sx={{ space: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#4CAF50', mr: 2 }} />
                  <Typography variant="body1">AI 맥진 진단 서비스</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#FF9800', mr: 2 }} />
                  <Typography variant="body1">실시간 대기/접수/진료 현황</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#9C27B0', mr: 2 }} />
                  <Typography variant="body1">환자 맞춤 건강 관리</Typography>
                </Box>
              </Box>
            </Card>

            {/* 연락처 */}
            <Card 
              sx={{ 
                p: 4, 
                bgcolor: '#fff', 
                borderRadius: 4, 
                boxShadow: '0 8px 32px rgba(25, 118, 210, 0.1)',
                border: '1px solid rgba(25, 118, 210, 0.1)',
                transition: 'all 0.3s ease',
                transform: 'translateZ(0)',
                backfaceVisibility: 'hidden',
                '&:hover': {
                  transform: 'translateY(-4px) translateZ(0)',
                  boxShadow: '0 12px 40px rgba(25, 118, 210, 0.15)',
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Box 
                  sx={{ 
                    width: 48, 
                    height: 48, 
                    borderRadius: '50%', 
                    bgcolor: '#1976D2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 2,
                    boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)'
                  }}
                >
                  <SearchIcon sx={{ color: 'white', fontSize: 24 }} />
                </Box>
                <Typography variant="h6" fontWeight={700} color="#1976D2">
                  연락처
                </Typography>
              </Box>
              <Box sx={{ space: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#1976D2', mr: 2 }} />
                  <Typography variant="body1" fontWeight={600}>☎ 051-621-0730</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#1976D2', mr: 2 }} />
                  <Typography variant="body1">부산광역시 XX XX XX</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#1976D2', mr: 2 }} />
                  <Typography variant="body1">이메일: info@maekstation.com</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#1976D2', mr: 2 }} />
                  <Typography variant="body1">카카오톡: @maekstation</Typography>
                </Box>
              </Box>
            </Card>
          </Box>
        </Box>
        <AppointmentManagerModal open={openAppointmentModal} onClose={() => setOpenAppointmentModal(false)} />
      </Box>
    </Box>
  );
} 