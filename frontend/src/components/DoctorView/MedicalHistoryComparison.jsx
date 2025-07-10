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
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  IconButton,
  Tooltip,
  Divider,
  LinearProgress
} from '@mui/material';
import {
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Compare as CompareIcon,
  History as HistoryIcon,
  Assessment as AssessmentIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  ZoomIn as ZoomInIcon
} from '@mui/icons-material';
import moment from 'moment';
import styled from 'styled-components';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const HistoryCard = styled(Card)`
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

const ComparisonDialog = styled(Dialog)`
  .MuiDialog-paper {
    max-width: 90vw;
    max-height: 90vh;
    border-radius: 16px;
  }
`;

const MedicalHistoryComparison = ({ patientId, patientName }) => {
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [error, setError] = useState(null);
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [comparisonDialogOpen, setComparisonDialogOpen] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState('6months');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchMedicalHistory();
  }, [patientId, filterPeriod, filterType]);

  const fetchMedicalHistory = async () => {
    try {
      setLoading(true);
      // 실제 API 호출로 대체
      const response = await fetch(`/api/patients/${patientId}/medical-history?period=${filterPeriod}&type=${filterType}`);
      const data = await response.json();
      setMedicalRecords(data.records || []);
    } catch (err) {
      setError('진료 기록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const calculateVisitFrequency = () => {
    if (medicalRecords.length < 2) return { frequency: 0, trend: 'stable' };
    
    const sortedRecords = medicalRecords.sort((a, b) => new Date(a.visitDate) - new Date(b.visitDate));
    const firstVisit = new Date(sortedRecords[0].visitDate);
    const lastVisit = new Date(sortedRecords[sortedRecords.length - 1].visitDate);
    const monthsDiff = moment(lastVisit).diff(moment(firstVisit), 'months') + 1;
    const frequency = medicalRecords.length / monthsDiff;
    
    // 최근 3개월과 이전 3개월 비교
    const recentRecords = sortedRecords.slice(-3);
    const previousRecords = sortedRecords.slice(-6, -3);
    const recentFreq = recentRecords.length / 3;
    const previousFreq = previousRecords.length / 3;
    
    let trend = 'stable';
    if (recentFreq > previousFreq * 1.2) trend = 'increasing';
    else if (recentFreq < previousFreq * 0.8) trend = 'decreasing';
    
    return { frequency, trend };
  };

  const analyzePulseTrends = () => {
    const recordsWithPulse = medicalRecords.filter(r => r.pulseWave);
    if (recordsWithPulse.length < 2) return null;
    
    return recordsWithPulse.map(record => ({
      date: moment(record.visitDate).format('YYYY-MM-DD'),
      systolicBP: record.pulseWave.systolicBP,
      diastolicBP: record.pulseWave.diastolicBP,
      heartRate: record.pulseWave.heartRate,
      pulsePressure: record.pulseWave.pulsePressure
    }));
  };

  const analyzeSymptomChanges = () => {
    const symptomHistory = medicalRecords.map(record => ({
      date: moment(record.visitDate).format('YYYY-MM-DD'),
      symptoms: record.symptoms || [],
      severity: record.severity || '보통',
      diagnosis: record.diagnosis || ''
    }));
    
    return symptomHistory;
  };

  const getVisitFrequencyAnalysis = () => {
    const { frequency, trend } = calculateVisitFrequency();
    
    let analysis = {
      level: 'normal',
      message: '정상적인 방문 빈도입니다.',
      recommendation: '현재 치료 계획을 유지하세요.'
    };
    
    if (frequency > 3) {
      analysis = {
        level: 'high',
        message: '높은 방문 빈도입니다.',
        recommendation: '치료 효과를 재검토하고 근본 원인을 파악해보세요.'
      };
    } else if (frequency < 0.5) {
      analysis = {
        level: 'low',
        message: '낮은 방문 빈도입니다.',
        recommendation: '정기적인 관리가 필요할 수 있습니다.'
      };
    }
    
    return { frequency, trend, analysis };
  };

  const renderTimelineView = () => {
    const sortedRecords = medicalRecords.sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate));
    
    return (
      <Box>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          진료 기록 타임라인
        </Typography>
        <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
          {sortedRecords.map((record, index) => (
            <HistoryCard key={record.recordId} sx={{ mb: 2, p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1e40af' }}>
                    {moment(record.visitDate).format('YYYY-MM-DD')} ({record.visitType || '진료'})
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#6b7280' }}>
                    {record.doctorName || '담당의'} | {record.recordId}
                  </Typography>
                </Box>
                <Chip 
                  label={`${sortedRecords.length - index}번째 방문`} 
                  size="small"
                  sx={{ background: 'rgba(30, 64, 175, 0.2)', color: '#1e3a8a' }}
                />
              </Box>
              
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {record.symptoms && (
                  <Grid xs={12} md={6}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>증상:</Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {record.symptoms.map((symptom, idx) => (
                        <Chip key={idx} label={symptom} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </Grid>
                )}
                
                {record.diagnosis && (
                  <Grid xs={12} md={6}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>진단:</Typography>
                    <Typography variant="body2">{record.diagnosis}</Typography>
                  </Grid>
                )}
                
                {record.pulseWave && (
                  <Grid xs={12}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>맥파 데이터:</Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      <Typography variant="body2">
                        수축기: <span style={{ color: '#dc2626', fontWeight: 600 }}>
                          {record.pulseWave.systolicBP} mmHg
                        </span>
                      </Typography>
                      <Typography variant="body2">
                        이완기: <span style={{ color: '#2563eb', fontWeight: 600 }}>
                          {record.pulseWave.diastolicBP} mmHg
                        </span>
                      </Typography>
                      <Typography variant="body2">
                        심박수: <span style={{ color: '#059669', fontWeight: 600 }}>
                          {record.pulseWave.heartRate} bpm
                        </span>
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
              
              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <Button 
                  size="small" 
                  variant="outlined"
                  onClick={() => handleRecordSelect(record)}
                >
                  비교 대상 선택
                </Button>
                <Button size="small" variant="outlined">
                  상세 보기
                </Button>
              </Box>
            </HistoryCard>
          ))}
        </Box>
      </Box>
    );
  };

  const renderTrendAnalysis = () => {
    const { frequency, trend, analysis } = getVisitFrequencyAnalysis();
    const pulseTrends = analyzePulseTrends();
    const symptomChanges = analyzeSymptomChanges();
    
    return (
      <Grid container spacing={3}>
        {/* 방문 빈도 분석 */}
        <Grid xs={12} md={6}>
          <HistoryCard sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              방문 빈도 분석
            </Typography>
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography sx={{ fontSize: '2rem', fontWeight: 700, color: '#1e40af' }}>
                {frequency.toFixed(1)}
              </Typography>
              <Typography sx={{ color: '#6b7280' }}>회/월</Typography>
            </Box>
            
            <TrendIndicator className={trend === 'increasing' ? 'worsening' : trend === 'decreasing' ? 'improving' : 'stable'}>
              {trend === 'increasing' && <TrendingUpIcon />}
              {trend === 'decreasing' && <TrendingDownIcon />}
              {trend === 'stable' && <CheckCircleIcon />}
              {trend === 'increasing' ? '증가 추세' : trend === 'decreasing' ? '감소 추세' : '안정적'}
            </TrendIndicator>
            
            <Alert severity={analysis.level === 'high' ? 'warning' : analysis.level === 'low' ? 'info' : 'success'} sx={{ mt: 2 }}>
              {analysis.message}
            </Alert>
            
            <Typography sx={{ mt: 2, fontSize: '0.9rem', color: '#6b7280' }}>
              {analysis.recommendation}
            </Typography>
          </HistoryCard>
        </Grid>

        {/* 맥파 추이 차트 */}
        {pulseTrends && (
          <Grid xs={12} md={6}>
            <HistoryCard sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                맥파 추이
              </Typography>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={pulseTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RechartsTooltip />
                  <Line type="monotone" dataKey="systolicBP" stroke="#dc2626" name="수축기" />
                  <Line type="monotone" dataKey="diastolicBP" stroke="#2563eb" name="이완기" />
                  <Line type="monotone" dataKey="heartRate" stroke="#059669" name="심박수" />
                </LineChart>
              </ResponsiveContainer>
            </HistoryCard>
          </Grid>
        )}

        {/* 증상 변화 분석 */}
        {symptomChanges.length > 0 && (
          <Grid xs={12}>
            <HistoryCard sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                증상 변화 분석
              </Typography>
              <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)' }}>
                      <TableCell sx={{ color: 'white', fontWeight: 600 }}>방문일</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 600 }}>증상</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 600 }}>중증도</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 600 }}>진단</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {symptomChanges.map((change, index) => (
                      <TableRow key={index} hover>
                        <TableCell>{change.date}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {change.symptoms.map((symptom, idx) => (
                              <Chip key={idx} label={symptom} size="small" />
                            ))}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={change.severity} 
                            size="small"
                            color={change.severity === '심함' ? 'error' : change.severity === '보통' ? 'warning' : 'success'}
                          />
                        </TableCell>
                        <TableCell>{change.diagnosis}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </HistoryCard>
          </Grid>
        )}
      </Grid>
    );
  };

  const renderComparisonView = () => {
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            진료 기록 비교
          </Typography>
          <Button
            variant="contained"
            startIcon={<CompareIcon />}
            onClick={() => setComparisonDialogOpen(true)}
            disabled={selectedRecords.length < 2}
            sx={{
              background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)',
              '&:hover': { background: 'linear-gradient(135deg, #1e3a8a 0%, #1e1b4b 100%)' }
            }}
          >
            선택된 기록 비교 ({selectedRecords.length})
          </Button>
        </Box>
        
        {selectedRecords.length === 0 ? (
          <Alert severity="info">
            비교할 진료 기록을 선택해주세요. 최소 2개 이상의 기록을 선택해야 합니다.
          </Alert>
        ) : (
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              선택된 기록:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {selectedRecords.map((record, index) => (
                <Chip
                  key={record.recordId}
                  label={`${moment(record.visitDate).format('YYYY-MM-DD')} (${record.visitType})`}
                  onDelete={() => handleRecordDeselect(record)}
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Box>
          </Box>
        )}
      </Box>
    );
  };

  const handleRecordSelect = (record) => {
    if (selectedRecords.find(r => r.recordId === record.recordId)) {
      handleRecordDeselect(record);
    } else {
      setSelectedRecords(prev => [...prev, record]);
    }
  };

  const handleRecordDeselect = (record) => {
    setSelectedRecords(prev => prev.filter(r => r.recordId !== record.recordId));
  };

  const renderComparisonDialog = () => {
    if (selectedRecords.length < 2) return null;
    
    const sortedRecords = selectedRecords.sort((a, b) => new Date(a.visitDate) - new Date(b.visitDate));
    
    return (
      <ComparisonDialog
        open={comparisonDialogOpen}
        onClose={() => setComparisonDialogOpen(false)}
        maxWidth="xl"
        fullWidth
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)',
          color: 'white',
          borderRadius: '12px 12px 0 0'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CompareIcon />
            진료 기록 비교 분석 - {patientName}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Grid container spacing={3}>
            {sortedRecords.map((record, index) => (
              <Grid xs={12} md={6} key={record.recordId}>
                <HistoryCard sx={{ p: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e40af', mb: 2 }}>
                    {moment(record.visitDate).format('YYYY-MM-DD')} ({record.visitType})
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>증상:</Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
                      {record.symptoms?.map((symptom, idx) => (
                        <Chip key={idx} label={symptom} size="small" />
                      ))}
                    </Box>
                  </Box>
                  
                  {record.pulseWave && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>맥파 데이터:</Typography>
                      <Grid container spacing={1}>
                        <Grid xs={6}>
                          <Typography variant="body2">
                            수축기: <span style={{ color: '#dc2626', fontWeight: 600 }}>
                              {record.pulseWave.systolicBP} mmHg
                            </span>
                          </Typography>
                        </Grid>
                        <Grid xs={6}>
                          <Typography variant="body2">
                            이완기: <span style={{ color: '#2563eb', fontWeight: 600 }}>
                              {record.pulseWave.diastolicBP} mmHg
                            </span>
                          </Typography>
                        </Grid>
                        <Grid xs={6}>
                          <Typography variant="body2">
                            심박수: <span style={{ color: '#059669', fontWeight: 600 }}>
                              {record.pulseWave.heartRate} bpm
                            </span>
                          </Typography>
                        </Grid>
                        <Grid xs={6}>
                          <Typography variant="body2">
                            맥압: <span style={{ color: '#7c3aed', fontWeight: 600 }}>
                              {record.pulseWave.pulsePressure} mmHg
                            </span>
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  )}
                  
                  {record.diagnosis && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>진단:</Typography>
                      <Typography variant="body2">{record.diagnosis}</Typography>
                    </Box>
                  )}
                  
                  {record.memo && (
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>메모:</Typography>
                      <Typography variant="body2">{record.memo}</Typography>
                    </Box>
                  )}
                </HistoryCard>
              </Grid>
            ))}
          </Grid>
          
          {/* 변화 추이 분석 */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              변화 추이 분석
            </Typography>
            <Grid container spacing={2}>
              <Grid xs={12} md={6}>
                <HistoryCard sx={{ p: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>혈압 변화:</Typography>
                  {sortedRecords.map((record, index) => (
                    <Box key={index} sx={{ mb: 1 }}>
                      <Typography variant="body2">
                        {moment(record.visitDate).format('MM-DD')}: 
                        {record.pulseWave?.systolicBP}/{record.pulseWave?.diastolicBP} mmHg
                      </Typography>
                    </Box>
                  ))}
                </HistoryCard>
              </Grid>
              <Grid xs={12} md={6}>
                <HistoryCard sx={{ p: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>심박수 변화:</Typography>
                  {sortedRecords.map((record, index) => (
                    <Box key={index} sx={{ mb: 1 }}>
                      <Typography variant="body2">
                        {moment(record.visitDate).format('MM-DD')}: {record.pulseWave?.heartRate} bpm
                      </Typography>
                    </Box>
                  ))}
                </HistoryCard>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setComparisonDialogOpen(false)}>
            닫기
          </Button>
          <Button variant="contained" startIcon={<PrintIcon />}>
            인쇄
          </Button>
          <Button variant="contained" startIcon={<DownloadIcon />}>
            PDF 다운로드
          </Button>
        </DialogActions>
      </ComparisonDialog>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress sx={{ color: '#1e40af' }} />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* 필터 섹션 */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>기간</InputLabel>
              <Select
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value)}
                label="기간"
              >
                <MenuItem value="3months">최근 3개월</MenuItem>
                <MenuItem value="6months">최근 6개월</MenuItem>
                <MenuItem value="1year">최근 1년</MenuItem>
                <MenuItem value="all">전체</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>방문 유형</InputLabel>
              <Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                label="방문 유형"
              >
                <MenuItem value="all">전체</MenuItem>
                <MenuItem value="초진">초진</MenuItem>
                <MenuItem value="재진">재진</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={fetchMedicalHistory}
              >
                필터 적용
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
              >
                데이터 내보내기
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>

      <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e40af', mb: 3 }}>
        <HistoryIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
        {patientName} 환자 진료 기록 분석
      </Typography>

      <Tabs 
        value={activeTab} 
        onChange={(e, newValue) => setActiveTab(newValue)}
        sx={{ mb: 3, '& .MuiTab-root': { fontWeight: 600 } }}
      >
        <Tab label="타임라인" icon={<TimelineIcon />} />
        <Tab label="추이 분석" icon={<TrendingUpIcon />} />
        <Tab label="기록 비교" icon={<CompareIcon />} />
      </Tabs>

      {activeTab === 0 && renderTimelineView()}
      {activeTab === 1 && renderTrendAnalysis()}
      {activeTab === 2 && renderComparisonView()}

      {renderComparisonDialog()}
    </Box>
  );
};

export default MedicalHistoryComparison; 