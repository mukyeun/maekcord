import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  Chip,
  Button,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import moment from 'moment';
import styled from 'styled-components';

const AnalysisCard = styled(Card)`
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

const TrendIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  font-weight: 600;
  
  &.improving {
    background: rgba(30, 64, 175, 0.1);
    color: #1e3a8a;
  }
  
  &.worsening {
    background: rgba(239, 68, 68, 0.1);
    color: #dc2626;
  }
  
  &.stable {
    background: rgba(59, 130, 246, 0.1);
    color: #2563eb;
  }
`;

const PatientTrendAnalysis = ({ patientId }) => {
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPatientData();
  }, [patientId]);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      // 실제 API 호출로 대체
      const response = await fetch(`/api/patients/${patientId}/trends`);
      const data = await response.json();
      setPatient(data.patient);
    } catch (err) {
      setError('환자 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const calculateTrends = () => {
    if (!patient?.medicalRecords) return {};

    const records = patient.medicalRecords.sort((a, b) => new Date(a.visitDate) - new Date(b.visitDate));
    const recentRecords = records.slice(-3); // 최근 3회 방문
    
    // 맥파 데이터 추이
    const pulseTrends = recentRecords
      .filter(r => r.pulseWaveData)
      .map(r => ({
        date: r.visitDate,
        systolicBP: r.pulseWaveData.systolicBP,
        diastolicBP: r.pulseWaveData.diastolicBP,
        heartRate: r.pulseWaveData.heartRate
      }));

    // 방문 빈도 분석
    const visitFrequency = records.length / Math.max(1, moment().diff(moment(patient.basicInfo?.firstVisitDate), 'months'));

    // 증상 변화 분석
    const symptomChanges = recentRecords.map(r => ({
      date: r.visitDate,
      symptoms: r.symptoms,
      severity: r.severity || '보통'
    }));

    return {
      pulseTrends,
      visitFrequency,
      symptomChanges,
      totalVisits: records.length,
      averageInterval: records.length > 1 ? 
        moment(records[records.length - 1].visitDate).diff(moment(records[0].visitDate), 'days') / (records.length - 1) : 0
    };
  };

  const getTrendDirection = (values) => {
    if (values.length < 2) return 'stable';
    const first = values[0];
    const last = values[values.length - 1];
    const change = ((last - first) / first) * 100;
    
    if (change > 5) return 'worsening';
    if (change < -5) return 'improving';
    return 'stable';
  };

  const renderPulseTrends = () => {
    const { pulseTrends } = calculateTrends();
    
    if (pulseTrends.length < 2) {
      return <Alert severity="info">맥파 데이터가 충분하지 않습니다.</Alert>;
    }

    const systolicValues = pulseTrends.map(p => p.systolicBP);
    const diastolicValues = pulseTrends.map(p => p.diastolicBP);
    const heartRateValues = pulseTrends.map(p => p.heartRate);

    return (
      <Grid container spacing={3}>
        <Grid xs={12} md={4}>
          <AnalysisCard sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TrendingUpIcon sx={{ color: '#dc2626', mr: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>수축기 혈압</Typography>
            </Box>
            <TrendIndicator className={getTrendDirection(systolicValues)}>
              {getTrendDirection(systolicValues) === 'improving' && <TrendingDownIcon />}
              {getTrendDirection(systolicValues) === 'worsening' && <TrendingUpIcon />}
              {getTrendDirection(systolicValues) === 'stable' && <CheckCircleIcon />}
              {getTrendDirection(systolicValues) === 'improving' ? '개선' : 
               getTrendDirection(systolicValues) === 'worsening' ? '악화' : '안정'}
            </TrendIndicator>
            <Typography sx={{ mt: 2, fontSize: '0.9rem', color: '#6b7280' }}>
              최근: {systolicValues[systolicValues.length - 1]} mmHg
            </Typography>
          </AnalysisCard>
        </Grid>

        <Grid xs={12} md={4}>
          <AnalysisCard sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TrendingUpIcon sx={{ color: '#2563eb', mr: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>이완기 혈압</Typography>
            </Box>
            <TrendIndicator className={getTrendDirection(diastolicValues)}>
              {getTrendDirection(diastolicValues) === 'improving' && <TrendingDownIcon />}
              {getTrendDirection(diastolicValues) === 'worsening' && <TrendingUpIcon />}
              {getTrendDirection(diastolicValues) === 'stable' && <CheckCircleIcon />}
              {getTrendDirection(diastolicValues) === 'improving' ? '개선' : 
               getTrendDirection(diastolicValues) === 'worsening' ? '악화' : '안정'}
            </TrendIndicator>
            <Typography sx={{ mt: 2, fontSize: '0.9rem', color: '#6b7280' }}>
              최근: {diastolicValues[diastolicValues.length - 1]} mmHg
            </Typography>
          </AnalysisCard>
        </Grid>

        <Grid xs={12} md={4}>
          <AnalysisCard sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TrendingUpIcon sx={{ color: '#059669', mr: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>심박수</Typography>
            </Box>
            <TrendIndicator className={getTrendDirection(heartRateValues)}>
              {getTrendDirection(heartRateValues) === 'improving' && <TrendingDownIcon />}
              {getTrendDirection(heartRateValues) === 'worsening' && <TrendingUpIcon />}
              {getTrendDirection(heartRateValues) === 'stable' && <CheckCircleIcon />}
              {getTrendDirection(heartRateValues) === 'improving' ? '개선' : 
               getTrendDirection(heartRateValues) === 'worsening' ? '악화' : '안정'}
            </TrendIndicator>
            <Typography sx={{ mt: 2, fontSize: '0.9rem', color: '#6b7280' }}>
              최근: {heartRateValues[heartRateValues.length - 1]} bpm
            </Typography>
          </AnalysisCard>
        </Grid>
      </Grid>
    );
  };

  const renderVisitAnalysis = () => {
    const { visitFrequency, totalVisits, averageInterval } = calculateTrends();
    
    return (
      <Grid container spacing={3}>
        <Grid xs={12} md={4}>
          <AnalysisCard sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>방문 빈도 분석</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography sx={{ fontSize: '2rem', fontWeight: 700, color: '#1e40af', mr: 2 }}>
                {visitFrequency.toFixed(1)}
              </Typography>
              <Typography sx={{ color: '#6b7280' }}>회/월</Typography>
            </Box>
            
            {visitFrequency > 3 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <WarningIcon />
                높은 방문 빈도입니다. 치료 효과를 재검토해보세요.
              </Alert>
            )}
            
            {visitFrequency < 0.5 && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <CheckCircleIcon />
                낮은 방문 빈도입니다. 정기적인 관리가 필요할 수 있습니다.
              </Alert>
            )}
          </AnalysisCard>
        </Grid>

        <Grid xs={12} md={4}>
          <AnalysisCard sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>방문 간격 분석</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography sx={{ fontSize: '2rem', fontWeight: 700, color: '#2563eb', mr: 2 }}>
                {averageInterval.toFixed(0)}
              </Typography>
              <Typography sx={{ color: '#6b7280' }}>일</Typography>
            </Box>
            
            <Typography sx={{ fontSize: '0.9rem', color: '#6b7280' }}>
              평균 방문 간격
            </Typography>
          </AnalysisCard>
        </Grid>
      </Grid>
    );
  };

  const renderSymptomAnalysis = () => {
    const { symptomChanges } = calculateTrends();
    
    if (symptomChanges.length === 0) {
      return <Alert severity="info">증상 데이터가 없습니다.</Alert>;
    }

    return (
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>방문일</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>증상</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>중증도</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>변화</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {symptomChanges.map((change, index) => (
              <TableRow key={index} hover>
                <TableCell>{moment(change.date).format('YYYY-MM-DD')}</TableCell>
                <TableCell>
                  {Array.isArray(change.symptoms) ? change.symptoms.join(', ') : change.symptoms}
                </TableCell>
                <TableCell>
                  <Chip 
                    label={change.severity} 
                    size="small"
                    color={change.severity === '심함' ? 'error' : change.severity === '보통' ? 'warning' : 'success'}
                  />
                </TableCell>
                <TableCell>
                  {index > 0 && (
                    <TrendIndicator className="stable">
                      {change.symptoms.length > symptomChanges[index - 1].symptoms.length ? 
                        <TrendingUpIcon /> : <TrendingDownIcon />}
                      {change.symptoms.length > symptomChanges[index - 1].symptoms.length ? '증가' : '감소'}
                    </TrendIndicator>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
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

  if (!patient) {
    return <Alert severity="info">환자 정보를 찾을 수 없습니다.</Alert>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, color: '#10B981', mb: 3 }}>
        {patient.basicInfo?.name} 환자 진료 추이 분석
      </Typography>

      <Tabs 
        value={activeTab} 
        onChange={(e, newValue) => setActiveTab(newValue)}
        sx={{ mb: 3, '& .MuiTab-root': { fontWeight: 600 } }}
      >
        <Tab label="맥파 추이" icon={<TimelineIcon />} />
        <Tab label="방문 분석" icon={<AssessmentIcon />} />
        <Tab label="증상 변화" icon={<TrendingUpIcon />} />
      </Tabs>

      {activeTab === 0 && renderPulseTrends()}
      {activeTab === 1 && renderVisitAnalysis()}
      {activeTab === 2 && renderSymptomAnalysis()}
    </Box>
  );
};

export default PatientTrendAnalysis; 