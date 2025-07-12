import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  Chip,
  Button,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Badge,
  Tooltip
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  PriorityHigh as PriorityHighIcon,
  History as HistoryIcon,
  LocalHospital as LocalHospitalIcon
} from '@mui/icons-material';
import moment from 'moment';
import styled from 'styled-components';

const DashboardCard = styled(Card)`
  background: rgba(255, 255, 255, 0.35);
  backdrop-filter: blur(8px);
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,0.18);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
  transition: all 0.3s;
  
  &:hover {
    box-shadow: 0 16px 48px 0 rgba(30, 64, 175, 0.18);
    transform: translateY(-4px);
  }
`;

const PriorityIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  font-weight: 600;
  
  &.high {
    background: rgba(239, 68, 68, 0.1);
    color: #dc2626;
  }
  
  &.medium {
    background: rgba(245, 158, 11, 0.1);
    color: #d97706;
  }
  
  &.low {
    background: rgba(30, 64, 175, 0.1);
    color: #1e3a8a;
  }
`;

// 홈/진료실/예약 등과 통일된 메인 버튼
const MainButton = styled.button`
  background: linear-gradient(135deg, #1976D2 0%, #1565C0 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.12);
  padding: 0 32px;
  height: 44px;
  font-size: 16px;
  cursor: pointer;
  &:hover, &:focus {
    background: linear-gradient(135deg, #1565C0 0%, #1976D2 100%);
    color: #fff;
  }
`;

const GradientHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  background: linear-gradient(135deg, #1976D2 0%, #1565C0 100%);
  color: #fff;
  border-radius: 20px;
  padding: 28px 32px 24px 32px;
  font-weight: 700;
  font-size: 32px;
  margin-bottom: 32px;
`;

const StatCard = styled.div`
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(25, 118, 210, 0.08);
  padding: 32px 0 24px 0;
  text-align: center;
  margin-bottom: 24px;
`;

const PatientQueueDashboard = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchQueueData();
    const interval = setInterval(fetchQueueData, 30000); // 30초마다 업데이트
    return () => clearInterval(interval);
  }, []);

  const fetchQueueData = async () => {
    try {
      setLoading(true);
      // 실제 API 호출로 대체
      const response = await fetch('/api/patients');
      const data = await response.json();
      setPatients(Array.isArray(data.patients) ? data.patients : []);
    } catch (err) {
      setError('대기 환자 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const calculatePatientPriority = (patient) => {
    const visitCount = patient.basicInfo?.visitCount || 0;
    const lastVisitDays = moment().diff(moment(patient.basicInfo?.lastVisitDate), 'days');
    const hasUrgentSymptoms = patient.pulseWaveInfo?.symptoms?.some(s => 
      s.includes('급성') || s.includes('심한') || s.includes('통증')
    );
    
    let priority = 'low';
    let score = 0;
    
    // 방문 빈도가 높은 환자 (월 3회 이상)
    if (visitCount > 3) {
      score += 3;
    } else if (visitCount > 1) {
      score += 1;
    }
    
    // 긴급 증상
    if (hasUrgentSymptoms) {
      score += 3;
    }
    
    // 최근 방문 후 일수 (너무 오래된 경우 우선순위 높음)
    if (lastVisitDays > 30) {
      score += 2;
    } else if (lastVisitDays > 7) {
      score += 1;
    }
    
    // 맥파 데이터 이상
    if (patient.pulseWaveInfo?.pulseWave) {
      const { systolicBP, diastolicBP, heartRate } = patient.pulseWaveInfo.pulseWave;
      if (systolicBP > 140 || diastolicBP > 90 || heartRate > 100) {
        score += 2;
      }
    }
    
    if (score >= 5) priority = 'high';
    else if (score >= 3) priority = 'medium';
    else priority = 'low';
    
    return { priority, score };
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#dc2626';
      case 'medium': return '#d97706';
      case 'low': return '#059669';
      default: return '#6b7280';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return <PriorityHighIcon />;
      case 'medium': return <WarningIcon />;
      case 'low': return <CheckCircleIcon />;
      default: return <ScheduleIcon />;
    }
  };

  const renderPatientCard = (patient, index) => {
    const { priority, score } = calculatePatientPriority(patient);
    const visitFrequency = patient.basicInfo?.visitCount / Math.max(1, 
      moment().diff(moment(patient.basicInfo?.firstVisitDate), 'months')
    );

    return (
      <DashboardCard key={patient._id} sx={{ mb: 2 }}>
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e40af' }}>
                {patient.basicInfo?.name} ({patient.age}세)
              </Typography>
              <Typography sx={{ color: '#6b7280', fontSize: '0.9rem' }}>
                환자 ID: {patient.basicInfo?.patientId}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <PriorityIndicator className={priority}>
                {getPriorityIcon(priority)}
                {priority === 'high' ? '높음' : priority === 'medium' ? '보통' : '낮음'}
              </PriorityIndicator>
              <Typography sx={{ fontSize: '0.8rem', color: '#6b7280', mt: 1 }}>
                우선순위 점수: {score}
              </Typography>
            </Box>
          </Box>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid xs={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography sx={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e40af' }}>
                  {patient.basicInfo?.visitCount || 0}
                </Typography>
                <Typography sx={{ fontSize: '0.8rem', color: '#6b7280' }}>
                  총 방문
                </Typography>
              </Box>
            </Grid>
            <Grid xs={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography sx={{ fontSize: '1.2rem', fontWeight: 700, color: '#2563eb' }}>
                  {visitFrequency.toFixed(1)}
                </Typography>
                <Typography sx={{ fontSize: '0.8rem', color: '#6b7280' }}>
                  월 평균
                </Typography>
              </Box>
            </Grid>
            <Grid xs={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography sx={{ fontSize: '1.2rem', fontWeight: 700, color: '#d97706' }}>
                  {moment().diff(moment(patient.basicInfo?.lastVisitDate), 'days')}
                </Typography>
                <Typography sx={{ fontSize: '0.8rem', color: '#6b7280' }}>
                  마지막 방문 후
                </Typography>
              </Box>
            </Grid>
            <Grid xs={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography sx={{ fontSize: '1.2rem', fontWeight: 700, color: '#7c3aed' }}>
                  {patient.basicInfo?.visitType}
                </Typography>
                <Typography sx={{ fontSize: '0.8rem', color: '#6b7280' }}>
                  방문 유형
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* 증상 및 맥파 정보 */}
          <Box sx={{ mb: 2 }}>
            {patient.pulseWaveInfo?.symptoms && (
              <Box sx={{ mb: 1 }}>
                <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: '#374151' }}>
                  증상:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {patient.pulseWaveInfo.symptoms.map((symptom, idx) => (
                    <Chip 
                      key={idx} 
                      label={symptom} 
                      size="small"
                      sx={{ 
                        background: symptom.includes('급성') || symptom.includes('심한') ? 
                          'rgba(239, 68, 68, 0.2)' : 'rgba(30, 64, 175, 0.2)',
                        color: symptom.includes('급성') || symptom.includes('심한') ? 
                          '#dc2626' : '#1e3a8a'
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {patient.pulseWaveInfo?.pulseWave && (
              <Box>
                <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: '#374151' }}>
                  맥파 데이터:
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Typography sx={{ fontSize: '0.8rem' }}>
                    수축기: <span style={{ 
                      color: patient.pulseWaveInfo.pulseWave.systolicBP > 140 ? '#dc2626' : '#1e3a8a',
                      fontWeight: 600 
                    }}>
                      {patient.pulseWaveInfo.pulseWave.systolicBP} mmHg
                    </span>
                  </Typography>
                  <Typography sx={{ fontSize: '0.8rem' }}>
                    이완기: <span style={{ 
                      color: patient.pulseWaveInfo.pulseWave.diastolicBP > 90 ? '#dc2626' : '#1e3a8a',
                      fontWeight: 600 
                    }}>
                      {patient.pulseWaveInfo.pulseWave.diastolicBP} mmHg
                    </span>
                  </Typography>
                  <Typography sx={{ fontSize: '0.8rem' }}>
                    심박수: <span style={{ 
                      color: patient.pulseWaveInfo.pulseWave.heartRate > 100 ? '#dc2626' : '#1e3a8a',
                      fontWeight: 600 
                    }}>
                      {patient.pulseWaveInfo.pulseWave.heartRate} bpm
                    </span>
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>

          {/* 경고 및 권장사항 */}
          <Box>
            {visitFrequency > 3 && (
              <Alert severity="warning" sx={{ mb: 1 }}>
                <WarningIcon />
                높은 방문 빈도 환자입니다. 치료 효과를 재검토해보세요.
              </Alert>
            )}
            
            {patient.pulseWaveInfo?.pulseWave?.systolicBP > 140 && (
              <Alert severity="error" sx={{ mb: 1 }}>
                <PriorityHighIcon />
                고혈압 위험 환자입니다. 즉시 진료가 필요합니다.
              </Alert>
            )}
            
            {moment().diff(moment(patient.basicInfo?.lastVisitDate), 'days') > 30 && (
              <Alert severity="info" sx={{ mb: 1 }}>
                <HistoryIcon />
                장기간 미방문 환자입니다. 정기 관리가 필요합니다.
              </Alert>
            )}
          </Box>

          {/* 액션 버튼 */}
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <MainButton>
              진료 시작
            </MainButton>
            <Button variant="outlined" size="small">
              상세 보기
            </Button>
            <Button variant="outlined" size="small">
              추이 분석
            </Button>
          </Box>
        </Box>
      </DashboardCard>
    );
  };

  const renderStatistics = () => {
    const highPriorityCount = patients.filter(p => calculatePatientPriority(p).priority === 'high').length;
    const frequentVisitors = patients.filter(p => {
      const visitCount = p.basicInfo?.visitCount || 0;
      const months = moment().diff(moment(p.basicInfo?.firstVisitDate), 'months') + 1;
      return (visitCount / months) > 2;
    }).length;

    return (
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid xs={12} sm={6} md={3}>
          <DashboardCard sx={{ p: 3, textAlign: 'center' }}>
            <Typography sx={{ fontSize: '2rem', fontWeight: 700, color: '#1e40af' }}>
              {patients.length}
            </Typography>
            <Typography sx={{ color: '#6b7280' }}>대기 환자</Typography>
          </DashboardCard>
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <DashboardCard sx={{ p: 3, textAlign: 'center' }}>
            <Typography sx={{ fontSize: '2rem', fontWeight: 700, color: '#dc2626' }}>
              {highPriorityCount}
            </Typography>
            <Typography sx={{ color: '#6b7280' }}>높은 우선순위</Typography>
          </DashboardCard>
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <DashboardCard sx={{ p: 3, textAlign: 'center' }}>
            <Typography sx={{ fontSize: '2rem', fontWeight: 700, color: '#d97706' }}>
              {frequentVisitors}
            </Typography>
            <Typography sx={{ color: '#6b7280' }}>빈도 높은 환자</Typography>
          </DashboardCard>
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <DashboardCard sx={{ p: 3, textAlign: 'center' }}>
            <Typography sx={{ fontSize: '2rem', fontWeight: 700, color: '#2563eb' }}>
              {patients.filter(p => p.basicInfo?.visitType === '재진').length}
            </Typography>
            <Typography sx={{ color: '#6b7280' }}>재진 환자</Typography>
          </DashboardCard>
        </Grid>
      </Grid>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress sx={{ color: '#10B981' }} />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <GradientHeader>
        <LocalHospitalIcon sx={{ mr: 2, fontSize: 40, verticalAlign: 'middle' }} />
        스마트 환자 대기실
      </GradientHeader>

      {/* 통계 카드 */}
      <Grid container spacing={2} mb={3}>
        <Grid>
          <Card sx={{ p: 2, textAlign: 'center', bgcolor: '#e3f2fd' }}>
            <Typography variant="h4" color="primary" fontWeight={700}>{patients.length}</Typography>
            <Typography variant="body2" color="text.secondary">전체 대기</Typography>
          </Card>
        </Grid>
        <Grid>
          <Card sx={{ p: 2, textAlign: 'center', bgcolor: '#fff3e0' }}>
            <Typography variant="h4" color="warning.main" fontWeight={700}>{patients.filter(p => calculatePatientPriority(p).priority === 'high').length}</Typography>
            <Typography variant="body2" color="text.secondary">높은 우선순위</Typography>
          </Card>
        </Grid>
        <Grid>
          <Card sx={{ p: 2, textAlign: 'center', bgcolor: '#e8f5e8' }}>
            <Typography variant="h4" color="success.main" fontWeight={700}>{patients.filter(p => {
                const visitCount = p.basicInfo?.visitCount || 0;
                const months = moment().diff(moment(p.basicInfo?.firstVisitDate), 'months') + 1;
                return (visitCount / months) > 2;
              }).length}
            </Typography>
            <Typography variant="body2" color="text.secondary">빈도 높은 환자</Typography>
          </Card>
        </Grid>
        <Grid>
          <Card sx={{ p: 2, textAlign: 'center', bgcolor: '#fce4ec' }}>
            <Typography variant="h4" color="error.main" fontWeight={700}>{patients.filter(p => p.basicInfo?.visitType === '재진').length}</Typography>
            <Typography variant="body2" color="text.secondary">재진 환자</Typography>
          </Card>
        </Grid>
      </Grid>

      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
        대기 환자 목록 (우선순위 순)
      </Typography>

      {patients.length === 0 ? (
        <Alert severity="info" sx={{ borderRadius: 2, mb: 2, p: 2 }}>현재 대기 중인 환자가 없습니다.</Alert>
      ) : (
        <Box>
          {patients
            .sort((a, b) => calculatePatientPriority(b).score - calculatePatientPriority(a).score)
            .map((patient, index) => renderPatientCard(patient, index))}
        </Box>
      )}
    </Box>
  );
};

export default PatientQueueDashboard; 