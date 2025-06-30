import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  TextField,
  Button,
  Box,
  Typography,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Tooltip,
  Checkbox,
  Fade,
  Zoom
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Close as CloseIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  HealthAndSafety as HealthIcon
} from '@mui/icons-material';
import moment from 'moment';
import styled, { keyframes } from 'styled-components';

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
    transform: translateY(-5px);
  }
`;

const pulse = keyframes`
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
  100% {
    transform: scale(1);
  }
`;

// 스타일드 컴포넌트
const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%);
  padding: 24px;
  animation: ${fadeInUp} 0.8s ease-out;
`;

const HeaderSection = styled.div`
  background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
  border-radius: 24px;
  padding: 32px;
  margin-bottom: 32px;
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
`;

const HeaderTitle = styled.h1`
  color: white;
  margin: 0 0 8px 0;
  font-weight: 900;
  font-size: 36px;
  text-shadow: 0 4px 8px rgba(0,0,0,0.3);
  animation: ${float} 3s ease-in-out infinite;
  
  @media (max-width: 768px) {
    font-size: 28px;
  }
`;

const HeaderSubtitle = styled.p`
  color: rgba(255,255,255,0.9);
  font-size: 16px;
  font-weight: 300;
  margin: 0;
`;

const GlassCard = styled(Card)`
  background: rgba(255, 255, 255, 0.35);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
  backdrop-filter: blur(8px);
  border-radius: 20px;
  border: 1px solid rgba(255,255,255,0.18);
  transition: all 0.3s;
  margin-bottom: 24px;
  
  &:hover {
    box-shadow: 0 16px 48px 0 rgba(30, 64, 175, 0.18);
    transform: translateY(-4px);
  }
`;

const SearchSection = styled(GlassCard)`
  padding: 24px;
  margin-bottom: 24px;
  animation: ${fadeInUp} 0.8s ease-out 0.2s both;
`;

const StyledTextField = styled(TextField)`
  .MuiOutlinedInput-root {
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(8px);
    
    &:hover .MuiOutlinedInput-notchedOutline {
      border-color: #1e40af;
    }
    
    &.Mui-focused .MuiOutlinedInput-notchedOutline {
      border-color: #1e40af;
    }
  }
`;

const StyledFormControl = styled(FormControl)`
  .MuiOutlinedInput-root {
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(8px);
    
    &:hover .MuiOutlinedInput-notchedOutline {
      border-color: #1e40af;
    }
    
    &.Mui-focused .MuiOutlinedInput-notchedOutline {
      border-color: #1e40af;
    }
  }
`;

const ActionButton = styled(Button)`
  border-radius: 12px;
  font-weight: 600;
  text-transform: none;
  transition: all 0.3s;
  
  &.MuiButton-contained {
    background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
    box-shadow: 0 4px 12px rgba(30, 64, 175, 0.3);
    
    &:hover {
      background: linear-gradient(135deg, #1e3a8a 0%, #1e1b4b 100%);
      box-shadow: 0 6px 16px rgba(30, 64, 175, 0.4);
      transform: translateY(-2px);
    }
  }
  
  &.MuiButton-outlined {
    border-color: #1e40af;
    color: #1e40af;
    
    &:hover {
      border-color: #1e3a8a;
      background: rgba(30, 64, 175, 0.1);
    }
  }
`;

const StyledTableContainer = styled(TableContainer)`
  background: rgba(255, 255, 255, 0.35);
  backdrop-filter: blur(8px);
  border-radius: 20px;
  border: 1px solid rgba(255,255,255,0.18);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
  overflow: hidden;
  animation: ${fadeInUp} 0.8s ease-out 0.4s both;
`;

const StyledTable = styled(Table)`
  .MuiTableHead-root {
    background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
    
    .MuiTableCell-head {
      color: white;
      font-weight: 700;
      font-size: 14px;
      border-bottom: none;
      padding: 16px 12px;
    }
  }
  
  .MuiTableBody-root {
    .MuiTableRow-root {
      transition: all 0.3s;
      
      &:hover {
        background: rgba(30, 64, 175, 0.08);
        transform: scale(1.01);
      }
      
      &.Mui-selected {
        background: rgba(30, 64, 175, 0.15);
      }
    }
    
    .MuiTableCell-body {
      border-bottom: 1px solid rgba(30, 64, 175, 0.1);
      padding: 12px;
      font-size: 14px;
    }
  }
`;

const StatusChip = styled(Chip)`
  border-radius: 12px;
  font-weight: 600;
  
  &.MuiChip-colorSuccess {
    background: rgba(30, 64, 175, 0.2);
    color: #1e3a8a;
    border: 1px solid rgba(30, 64, 175, 0.3);
  }
  
  &.MuiChip-colorError {
    background: rgba(239, 68, 68, 0.2);
    color: #dc2626;
    border: 1px solid rgba(239, 68, 68, 0.3);
  }
  
  &.MuiChip-colorWarning {
    background: rgba(245, 158, 11, 0.2);
    color: #d97706;
    border: 1px solid rgba(245, 158, 11, 0.3);
  }
`;

const StatsCard = styled(GlassCard)`
  text-align: center;
  padding: 24px;
  animation: ${fadeInUp} 0.8s ease-out 0.6s both;
`;

const StatsNumber = styled.div`
  font-size: 32px;
  font-weight: 900;
  color: #1e40af;
  margin-bottom: 8px;
`;

const StatsLabel = styled.div`
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
`;

const ResponsiveGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
  @media (max-width: 1200px) {
    grid-template-columns: 1fr 1fr;
  }
  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
`;

const PatientCard = styled(GlassCard)`
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  animation: ${fadeInUp} 0.8s ease-out 0.4s both;
  
  &:hover {
    animation: ${pulse} 0.6s ease-in-out;
  }
`;

const CardTitle = styled.div`
  font-size: 1.2rem;
  font-weight: 700;
  color: #1e40af;
  margin-bottom: 0.5rem;
`;

const CardRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1rem;
  padding: 0.2rem 0;
  color: #374151;
`;

const CardActions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const PatientDataTable = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [visitTypeFilter, setVisitTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [selectedIds, setSelectedIds] = useState([]);

  // 환자 데이터 조회
  const fetchPatients = async () => {
    setLoading(true);
    try {
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm,
        visitType: visitTypeFilter,
        status: statusFilter
      };

      // 임시로 /api/patients/data 사용
      const response = await axios.get('/api/patients/data', { params });
      
      if (response.data.success) {
        setPatients(response.data.patients);
        setTotalRecords(response.data.pagination.totalRecords);
      }
    } catch (error) {
      console.error('환자 데이터 조회 오류:', error);
      setMessage({ type: 'error', text: '환자 데이터 조회 중 오류가 발생했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 조회
  useEffect(() => {
    fetchPatients();
  }, [page, rowsPerPage, searchTerm, visitTypeFilter, statusFilter]);

  // 페이지 변경
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // 페이지당 행 수 변경
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // 검색
  const handleSearch = () => {
    setPage(0);
    fetchPatients();
  };

  // 필터 초기화
  const handleResetFilters = () => {
    setSearchTerm('');
    setVisitTypeFilter('');
    setStatusFilter('');
    setPage(0);
  };

  // 환자 상세 정보 조회
  const handleViewPatient = async (patientId) => {
    try {
      // 임시로 /api/patients/data/{patientId} 사용
      const response = await axios.get(`/api/patients/data/${patientId}`);
      if (response.data.success) {
        setSelectedPatient(response.data.patientData);
        setDetailDialogOpen(true);
      }
    } catch (error) {
      console.error('환자 상세 정보 조회 오류:', error);
      setMessage({ type: 'error', text: '환자 상세 정보 조회 중 오류가 발생했습니다.' });
    }
  };

  // 환자 데이터 엑셀 내보내기
  const handleExportData = async () => {
    setExportLoading(true);
    try {
      const response = await axios.post('/api/data-export/export/patient-data', {
        startDate: '',
        endDate: '',
        visitType: visitTypeFilter,
        status: statusFilter
      });

      if (response.data.success) {
        // 파일 다운로드
        const downloadResponse = await axios.get(
          `/api/data-export/download/${response.data.fileName}`,
          { responseType: 'blob' }
        );

        const url = window.URL.createObjectURL(new Blob([downloadResponse.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', response.data.fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();

        setMessage({ type: 'success', text: '환자 데이터가 성공적으로 내보내졌습니다.' });
      }
    } catch (error) {
      console.error('데이터 내보내기 오류:', error);
      setMessage({ type: 'error', text: '데이터 내보내기 중 오류가 발생했습니다.' });
    } finally {
      setExportLoading(false);
    }
  };

  // 성별 표시
  const getGenderDisplay = (gender) => {
    switch (gender) {
      case 'male': return '남성';
      case 'female': return '여성';
      default: return '미입력';
    }
  };

  // 상태 표시
  const getStatusDisplay = (status) => {
    switch (status) {
      case 'active': return { label: '활성', color: 'success' };
      case 'inactive': return { label: '비활성', color: 'error' };
      case 'deceased': return { label: '사망', color: 'warning' };
      default: return { label: '미정', color: 'default' };
    }
  };

  // 홈으로 돌아가기
  const handleClose = () => {
    navigate(-1); // 이전 페이지로 돌아가기
  };

  // 긴 텍스트를 위한 헬퍼 함수
  const renderTruncatedCell = (text, maxLength = 20) => {
    if (!text || text.length <= maxLength) {
      return text || 'N/A';
    }
    return (
      <Tooltip title={text} arrow>
        <Typography variant="body2" component="span">
          {`${text.substring(0, maxLength)}...`}
        </Typography>
      </Tooltip>
    );
  };

  // 체크박스 전체 선택/해제
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedIds(patients.map((p) => p._id));
    } else {
      setSelectedIds([]);
    }
  };

  // 개별 체크박스 선택/해제
  const handleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  // 선택 삭제
  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm('선택한 환자 데이터를 삭제하시겠습니까?')) return;
    try {
      await axios.post('/api/patients/delete-multiple', { ids: selectedIds });
      setMessage({ type: 'success', text: '선택한 환자 데이터가 삭제되었습니다.' });
      setSelectedIds([]);
      fetchPatients();
    } catch (error) {
      setMessage({ type: 'error', text: '삭제 중 오류가 발생했습니다.' });
    }
  };

  // 모바일 여부 감지
  const isMobile = window.innerWidth < 700;

  // 맥파 값 접근 헬퍼 함수
  const getPulseValue = (patient, key) => {
    const value = patient.pulseWaveInfo?.pulseWave?.[key];
    return value === 0 ? 0 : value ?? 'N/A';
  };

  // 테이블 컬럼 정의
  const columns = [
    { field: 'patientId', headerName: '환자 ID', flex: 1, valueGetter: (params) => params.row.basicInfo?.patientId || 'N/A' },
    { field: 'name', headerName: '이름', flex: 0.7, valueGetter: (params) => params.row.basicInfo?.name || 'N/A' },
    {
      field: 'gender',
      headerName: '성별',
      flex: 0.5,
      valueGetter: (params) => params.row.basicInfo?.gender,
      renderCell: (params) => getGenderDisplay(params.value),
    },
    { field: 'age', headerName: '나이', flex: 0.5, valueGetter: (params) => params.row.age || 'N/A' },
    { field: 'phone', headerName: '전화번호', flex: 1, valueGetter: (params) => params.row.basicInfo?.phone || 'N/A' },
    {
      field: 'visitType',
      headerName: '방문 유형',
      flex: 0.7,
      valueGetter: (params) => params.row.basicInfo?.visitType || 'N/A',
    },
    {
      field: 'visitCount',
      headerName: '방문 횟수',
      flex: 0.7,
      valueGetter: (params) => params.row.basicInfo?.visitCount || 'N/A',
    },
    {
      field: 'lastVisitDate',
      headerName: '마지막 방문일',
      flex: 1,
      valueGetter: (params) => params.row.basicInfo?.lastVisitDate,
      renderCell: (params) => params.value ? moment(params.value).format('YYYY-MM-DD') : 'N/A',
    },
    {
      field: 'medication',
      headerName: '복용약물',
      flex: 1,
      valueGetter: (params) => {
        if (!params.row.medication || !params.row.medication.current || params.row.medication.current.length === 0) {
          return 'N/A';
        }
        return params.row.medication.current.map(med => med.name).join(', ');
      },
      renderCell: (params) => {
        console.log('pulseWaveInfo:', params.row.pulseWaveInfo);
        return renderTruncatedCell(params.value);
      },
    },
    {
      field: 'symptoms',
      headerName: '증상',
      flex: 1.5,
      valueGetter: (params) => params.row.pulseWaveInfo?.symptoms || 'N/A',
      renderCell: (params) => renderTruncatedCell(params.value),
    },
    {
      field: 'stress',
      headerName: '스트레스',
      flex: 1,
      valueGetter: (params) => {
        if (!params.row.pulseWaveInfo || !params.row.pulseWaveInfo.stress) {
          return 'N/A';
        }
        if (typeof params.row.pulseWaveInfo.stress === 'object') {
          return `${params.row.pulseWaveInfo.stress.level} (${params.row.pulseWaveInfo.stress.score}점)`;
        }
        return params.row.pulseWaveInfo.stress;
      },
      renderCell: (params) => {
        console.log('pulseWaveInfo:', params.row.pulseWaveInfo);
        return renderTruncatedCell(params.value);
      },
    },
    {
      field: 'systolicBP',
      headerName: '수축기혈압',
      flex: 0.8,
      valueGetter: (params) => {
        const v = params.row.pulseWaveInfo?.pulseWave?.systolicBP;
        return v === 0 ? 0 : v ?? 'N/A';
      },
    },
    {
      field: 'diastolicBP',
      headerName: '이완기혈압',
      flex: 0.8,
      valueGetter: (params) => {
        const v = params.row.pulseWaveInfo?.pulseWave?.diastolicBP;
        return v === 0 ? 0 : v ?? 'N/A';
      },
    },
    {
      field: 'heartRate',
      headerName: '심박수',
      flex: 0.8,
      valueGetter: (params) => {
        const v = params.row.pulseWaveInfo?.pulseWave?.heartRate;
        return v === 0 ? 0 : v ?? 'N/A';
      },
    },
    {
      field: 'pulsePressure',
      headerName: '맥압',
      flex: 0.8,
      valueGetter: (params) => {
        const v = params.row.pulseWaveInfo?.pulseWave?.pulsePressure;
        return v === 0 ? 0 : v ?? 'N/A';
      },
    },
    {
      field: 'a-b',
      headerName: 'a-b',
      flex: 0.7,
      valueGetter: (params) => {
        const v = params.row.pulseWaveInfo?.pulseWave?.['a-b'];
        return v === 0 ? 0 : v ?? 'N/A';
      },
    },
    {
      field: 'a-c',
      headerName: 'a-c',
      flex: 0.7,
      valueGetter: (params) => {
        const v = params.row.pulseWaveInfo?.pulseWave?.['a-c'];
        return v === 0 ? 0 : v ?? 'N/A';
      },
    },
    {
      field: 'a-d',
      headerName: 'a-d',
      flex: 0.7,
      valueGetter: (params) => {
        const v = params.row.pulseWaveInfo?.pulseWave?.['a-d'];
        return v === 0 ? 0 : v ?? 'N/A';
      },
    },
    {
      field: 'a-e',
      headerName: 'a-e',
      flex: 0.7,
      valueGetter: (params) => {
        const v = params.row.pulseWaveInfo?.pulseWave?.['a-e'];
        return v === 0 ? 0 : v ?? 'N/A';
      },
    },
    {
      field: 'b/a',
      headerName: 'b/a',
      flex: 0.7,
      valueGetter: (params) => {
        const v = params.row.pulseWaveInfo?.pulseWave?.['b/a'];
        return v === 0 ? 0 : v ?? 'N/A';
      },
    },
    {
      field: 'c/a',
      headerName: 'c/a',
      flex: 0.7,
      valueGetter: (params) => {
        const v = params.row.pulseWaveInfo?.pulseWave?.['c/a'];
        return v === 0 ? 0 : v ?? 'N/A';
      },
    },
    {
      field: 'd/a',
      headerName: 'd/a',
      flex: 0.7,
      valueGetter: (params) => {
        const v = params.row.pulseWaveInfo?.pulseWave?.['d/a'];
        return v === 0 ? 0 : v ?? 'N/A';
      },
    },
    {
      field: 'e/a',
      headerName: 'e/a',
      flex: 0.7,
      valueGetter: (params) => {
        const v = params.row.pulseWaveInfo?.pulseWave?.['e/a'];
        return v === 0 ? 0 : v ?? 'N/A';
      },
    },
    {
      field: 'memo',
      headerName: '메모',
      flex: 1.5,
      valueGetter: (params) => params.row.pulseWaveInfo?.memo || 'N/A',
      renderCell: (params) => renderTruncatedCell(params.value),
    },
    {
      field: 'status',
      headerName: '상태',
      flex: 0.7,
      renderCell: (params) => {
        const statusInfo = getStatusDisplay(params.row.status);
        return <Chip label={statusInfo.label} color={statusInfo.color} size="small" />;
      },
    },
    {
      field: 'actions',
      headerName: '작업',
      flex: 1,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="상세보기">
            <IconButton onClick={() => handleViewPatient(params.row._id)}>
              <ViewIcon />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <PageContainer>
      {/* 헤더 섹션 */}
      <HeaderSection>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <HealthIcon sx={{ fontSize: 40, color: 'white' }} />
          <div>
            <HeaderTitle>환자 데이터 관리</HeaderTitle>
            <HeaderSubtitle>전체 환자 정보를 한눈에 확인하고 관리하세요</HeaderSubtitle>
          </div>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <ActionButton
            variant="outlined"
            startIcon={<CloseIcon />}
            onClick={handleClose}
            sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
          >
            닫기
          </ActionButton>
        </Box>
      </HeaderSection>

      {/* 통계 카드 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard>
            <PeopleIcon sx={{ fontSize: 40, color: '#1e40af', mb: 1 }} />
            <StatsNumber>{totalRecords}</StatsNumber>
            <StatsLabel>전체 환자</StatsLabel>
          </StatsCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard>
            <TrendingUpIcon sx={{ fontSize: 40, color: '#1e40af', mb: 1 }} />
            <StatsNumber>{patients.filter(p => p.status === 'active').length}</StatsNumber>
            <StatsLabel>활성 환자</StatsLabel>
          </StatsCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard>
            <HealthIcon sx={{ fontSize: 40, color: '#1e40af', mb: 1 }} />
            <StatsNumber>{patients.filter(p => p.pulseWaveInfo?.pulseWave).length}</StatsNumber>
            <StatsLabel>맥파 측정 완료</StatsLabel>
          </StatsCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard>
            <RefreshIcon sx={{ fontSize: 40, color: '#1e40af', mb: 1 }} />
            <StatsNumber>{patients.filter(p => p.basicInfo?.visitType === '재진').length}</StatsNumber>
            <StatsLabel>재진 환자</StatsLabel>
          </StatsCard>
        </Grid>
      </Grid>

      {/* 검색/필터 섹션 */}
      <SearchSection>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
            <StyledTextField
              fullWidth
              label="검색 (이름, ID, 전화번호)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              InputProps={{
                endAdornment: (
                  <IconButton onClick={handleSearch} sx={{ color: '#1e40af' }}>
                    <SearchIcon />
                  </IconButton>
                )
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <StyledFormControl fullWidth>
              <InputLabel>방문 유형</InputLabel>
              <Select
                value={visitTypeFilter}
                onChange={(e) => setVisitTypeFilter(e.target.value)}
                label="방문 유형"
              >
                <MenuItem value="">전체</MenuItem>
                <MenuItem value="초진">초진</MenuItem>
                <MenuItem value="재진">재진</MenuItem>
              </Select>
            </StyledFormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <StyledFormControl fullWidth>
              <InputLabel>상태</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="상태"
              >
                <MenuItem value="">전체</MenuItem>
                <MenuItem value="active">활성</MenuItem>
                <MenuItem value="inactive">비활성</MenuItem>
                <MenuItem value="deceased">사망</MenuItem>
              </Select>
            </StyledFormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <ActionButton
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={handleResetFilters}
              >
                필터 초기화
              </ActionButton>
              <ActionButton
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchPatients}
              >
                새로고침
              </ActionButton>
              <ActionButton
                variant="contained"
                startIcon={exportLoading ? <CircularProgress size={20} /> : <DownloadIcon />}
                onClick={handleExportData}
                disabled={exportLoading}
              >
                엑셀 내보내기
              </ActionButton>
              <ActionButton
                variant="contained"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleDeleteSelected}
                disabled={selectedIds.length === 0}
                sx={{
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'
                  }
                }}
              >
                선택 삭제
              </ActionButton>
            </Box>
          </Grid>
        </Grid>
      </SearchSection>

      {/* 메시지 표시 */}
      {message.text && (
        <Fade in={!!message.text}>
          <Alert 
            severity={message.type} 
            sx={{ mb: 2, borderRadius: 2 }}
            onClose={() => setMessage({ type: '', text: '' })}
          >
            {message.text}
          </Alert>
        </Fade>
      )}

      {/* 반응형 카드/테이블 렌더링 */}
      {isMobile ? (
        <ResponsiveGrid>
          {patients.map((patient) => (
            <PatientCard key={patient._id}>
              <CardTitle>{patient.basicInfo?.name || '이름 없음'}</CardTitle>
              <CardRow><span>환자 ID</span><span>{patient.basicInfo?.patientId || 'N/A'}</span></CardRow>
              <CardRow><span>성별</span><span>{getGenderDisplay(patient.basicInfo?.gender)}</span></CardRow>
              <CardRow><span>나이</span><span>{patient.age || 'N/A'}</span></CardRow>
              <CardRow><span>전화번호</span><span>{patient.basicInfo?.phone || 'N/A'}</span></CardRow>
              <CardRow><span>방문 유형</span><span>{patient.basicInfo?.visitType || 'N/A'}</span></CardRow>
              <CardRow><span>복용약물</span><span>{renderTruncatedCell(patient.medication?.current.map(med => med.name).join(', '))}</span></CardRow>
              <CardRow><span>증상</span><span>{renderTruncatedCell(patient.pulseWaveInfo?.symptoms || 'N/A')}</span></CardRow>
              <CardRow><span>상태</span><span>{getStatusDisplay(patient.status).label}</span></CardRow>
              <CardActions>
                <ActionButton size="small" variant="outlined" onClick={() => handleViewPatient(patient._id)}>
                  상세보기
                </ActionButton>
              </CardActions>
            </PatientCard>
          ))}
        </ResponsiveGrid>
      ) : (
        // 데스크탑: 개선된 테이블
        <StyledTableContainer>
          <StyledTable sx={{ minWidth: 650 }} aria-label="환자 데이터 테이블">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selectedIds.length > 0 && selectedIds.length < patients.length}
                    checked={patients.length > 0 && selectedIds.length === patients.length}
                    onChange={handleSelectAll}
                    sx={{ color: 'white', '&.Mui-checked': { color: 'white' } }}
                  />
                </TableCell>
                <TableCell>환자 ID</TableCell>
                <TableCell>이름</TableCell>
                <TableCell>성별</TableCell>
                <TableCell>나이</TableCell>
                <TableCell>전화번호</TableCell>
                <TableCell>방문 유형</TableCell>
                <TableCell>방문 횟수</TableCell>
                <TableCell>마지막 방문일</TableCell>
                <TableCell>복용약물</TableCell>
                <TableCell>증상</TableCell>
                <TableCell>스트레스</TableCell>
                <TableCell>수축기혈압</TableCell>
                <TableCell>이완기혈압</TableCell>
                <TableCell>심박수</TableCell>
                <TableCell>맥압</TableCell>
                <TableCell>a-b</TableCell>
                <TableCell>a-c</TableCell>
                <TableCell>a-d</TableCell>
                <TableCell>a-e</TableCell>
                <TableCell>b/a</TableCell>
                <TableCell>c/a</TableCell>
                <TableCell>d/a</TableCell>
                <TableCell>e/a</TableCell>
                <TableCell>메모</TableCell>
                <TableCell>상태</TableCell>
                <TableCell>작업</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={28} align="center" sx={{ py: 8 }}>
                    <CircularProgress sx={{ color: '#1e40af' }} />
                    <Typography sx={{ mt: 2, color: '#6b7280' }}>데이터를 불러오는 중...</Typography>
                  </TableCell>
                </TableRow>
              ) : patients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={28} align="center" sx={{ py: 8 }}>
                    <PeopleIcon sx={{ fontSize: 60, color: '#d1d5db', mb: 2 }} />
                    <Typography sx={{ color: '#6b7280', fontSize: 18 }}>환자 데이터가 없습니다.</Typography>
                    <Typography sx={{ color: '#9ca3af', fontSize: 14 }}>새로운 환자를 등록해보세요.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                patients.map((patient) => {
                  const statusInfo = getStatusDisplay(patient.status);

                  const medicationText =
                    (Array.isArray(patient.medication?.current) && patient.medication.current.length > 0
                      ? (typeof patient.medication.current[0] === 'string'
                          ? patient.medication.current.join(', ')
                          : patient.medication.current.map(med => med.name).join(', '))
                      : 'N/A');

                  const symptomsText = (
                    patient.pulseWaveInfo?.symptoms ||
                    (Array.isArray(patient.symptoms?.mainSymptoms) && patient.symptoms.mainSymptoms.length > 0 && patient.symptoms.mainSymptoms.map(s => s.symptom).join(', ')) ||
                    'N/A'
                  );

                  const stressText =
                    patient.pulseWaveInfo?.stress
                      ? `${patient.pulseWaveInfo.stress.level} (${patient.pulseWaveInfo.stress.score}점)`
                      : 'N/A';

                  const memoText = patient.pulseWaveInfo?.memo || patient.symptoms?.symptomMemo || 'N/A';
                  
                  return (
                    <TableRow 
                      key={patient._id} 
                      hover 
                      selected={selectedIds.includes(patient._id)}
                      sx={{ '&:hover': { cursor: 'pointer' } }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedIds.includes(patient._id)}
                          onChange={() => handleSelectOne(patient._id)}
                          sx={{ color: '#1e40af', '&.Mui-checked': { color: '#1e40af' } }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#1e40af' }}>{patient.basicInfo?.patientId}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{patient.basicInfo?.name}</TableCell>
                      <TableCell>{getGenderDisplay(patient.basicInfo?.gender)}</TableCell>
                      <TableCell>{patient.age || 'N/A'}</TableCell>
                      <TableCell>{patient.basicInfo?.phone || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip 
                          label={patient.basicInfo?.visitType} 
                          size="small"
                          sx={{ 
                            background: patient.basicInfo?.visitType === '초진' 
                              ? 'rgba(30, 64, 175, 0.2)' 
                              : 'rgba(59, 130, 246, 0.2)',
                            color: patient.basicInfo?.visitType === '초진' ? '#1e3a8a' : '#2563eb',
                            fontWeight: 600
                          }}
                        />
                      </TableCell>
                      <TableCell>{patient.basicInfo?.visitCount}</TableCell>
                      <TableCell>
                        {patient.basicInfo?.lastVisitDate
                          ? moment(patient.basicInfo.lastVisitDate).format('YYYY-MM-DD')
                          : 'N/A'}
                      </TableCell>
                      <TableCell>{renderTruncatedCell(medicationText)}</TableCell>
                      <TableCell>{renderTruncatedCell(symptomsText)}</TableCell>
                      <TableCell>{renderTruncatedCell(stressText)}</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#dc2626' }}>{getPulseValue(patient, 'systolicBP')}</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#2563eb' }}>{getPulseValue(patient, 'diastolicBP')}</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#059669' }}>{getPulseValue(patient, 'heartRate')}</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#7c3aed' }}>{getPulseValue(patient, 'pulsePressure')}</TableCell>
                      <TableCell>{getPulseValue(patient, 'a-b')}</TableCell>
                      <TableCell>{getPulseValue(patient, 'a-c')}</TableCell>
                      <TableCell>{getPulseValue(patient, 'a-d')}</TableCell>
                      <TableCell>{getPulseValue(patient, 'a-e')}</TableCell>
                      <TableCell>{getPulseValue(patient, 'b/a')}</TableCell>
                      <TableCell>{getPulseValue(patient, 'c/a')}</TableCell>
                      <TableCell>{getPulseValue(patient, 'd/a')}</TableCell>
                      <TableCell>{getPulseValue(patient, 'e/a')}</TableCell>
                      <TableCell>{renderTruncatedCell(memoText)}</TableCell>
                      <TableCell>
                        <StatusChip 
                          label={statusInfo.label} 
                          color={statusInfo.color} 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="상세보기" arrow>
                          <IconButton
                            size="small"
                            onClick={() => handleViewPatient(patient._id)}
                            sx={{ 
                              color: '#1e40af',
                              '&:hover': { 
                                background: 'rgba(30, 64, 175, 0.1)',
                                transform: 'scale(1.1)'
                              }
                            }}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </StyledTable>
        </StyledTableContainer>
      )}

      {/* 페이지네이션 */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
        <TablePagination
          component="div"
          count={totalRecords}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
          labelRowsPerPage="페이지당 행 수:"
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} / ${count !== -1 ? count : `${to}개 이상`}`
          }
          sx={{
            '.MuiTablePagination-select': {
              borderRadius: 2,
              border: '1px solid #e5e7eb'
            },
            '.MuiTablePagination-actions button': {
              borderRadius: 2,
              '&:hover': {
                background: 'rgba(30, 64, 175, 0.1)'
              }
            }
          }}
        />
      </Box>

      {/* 환자 상세 정보 다이얼로그 */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)',
          color: 'white',
          borderRadius: '12px 12px 0 0'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <HealthIcon />
            환자 상세 정보 - {selectedPatient?.basicInfo?.name}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {selectedPatient && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                {/* 기본 정보 */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom sx={{ color: '#1e40af', fontWeight: 700 }}>
                    기본 정보
                  </Typography>
                  <Box sx={{ pl: 2 }}>
                    <Typography sx={{ mb: 1 }}><strong>환자 ID:</strong> {selectedPatient.basicInfo.patientId}</Typography>
                    <Typography sx={{ mb: 1 }}><strong>이름:</strong> {selectedPatient.basicInfo.name}</Typography>
                    <Typography sx={{ mb: 1 }}><strong>성별:</strong> {getGenderDisplay(selectedPatient.basicInfo.gender)}</Typography>
                    <Typography sx={{ mb: 1 }}><strong>나이:</strong> {selectedPatient.age || 'N/A'}</Typography>
                    <Typography sx={{ mb: 1 }}><strong>전화번호:</strong> {selectedPatient.basicInfo.phone || 'N/A'}</Typography>
                    <Typography sx={{ mb: 1 }}><strong>방문 유형:</strong> {selectedPatient.basicInfo.visitType}</Typography>
                    <Typography sx={{ mb: 1 }}><strong>방문 횟수:</strong> {selectedPatient.basicInfo.visitCount}</Typography>
                    <Typography sx={{ mb: 1 }}><strong>첫 방문일:</strong> {moment(selectedPatient.basicInfo.firstVisitDate).format('YYYY-MM-DD')}</Typography>
                    <Typography sx={{ mb: 1 }}><strong>마지막 방문일:</strong> {moment(selectedPatient.basicInfo.lastVisitDate).format('YYYY-MM-DD')}</Typography>
                  </Box>
                </Grid>

                {/* 신체 정보 */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom sx={{ color: '#1e40af', fontWeight: 700 }}>
                    신체 정보
                  </Typography>
                  <Box sx={{ pl: 2 }}>
                    <Typography sx={{ mb: 1 }}><strong>신장:</strong> {selectedPatient.basicInfo.height ? `${selectedPatient.basicInfo.height}cm` : 'N/A'}</Typography>
                    <Typography sx={{ mb: 1 }}><strong>체중:</strong> {selectedPatient.basicInfo.weight ? `${selectedPatient.basicInfo.weight}kg` : 'N/A'}</Typography>
                    <Typography sx={{ mb: 1 }}><strong>BMI:</strong> {selectedPatient.basicInfo.bmi || 'N/A'}</Typography>
                    <Typography sx={{ mb: 1 }}><strong>직업:</strong> {selectedPatient.basicInfo.occupation || 'N/A'}</Typography>
                    <Typography sx={{ mb: 1 }}><strong>작업 강도:</strong> {selectedPatient.basicInfo.workIntensity || 'N/A'}</Typography>
                  </Box>
                </Grid>

                {/* 맥파 분석 정보 */}
                {selectedPatient.pulseWaveInfo && Object.keys(selectedPatient.pulseWaveInfo).length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom sx={{ color: '#1e40af', fontWeight: 700 }}>
                      맥파 분석 정보
                    </Typography>
                    <Box sx={{ pl: 2 }}>
                      <Typography sx={{ mb: 2 }}><strong>측정일:</strong> {moment(selectedPatient.pulseWaveInfo.date).format('YYYY-MM-DD HH:mm')}</Typography>
                      
                      {selectedPatient.pulseWaveInfo.pulseWave && (
                        <>
                          <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 600 }}><strong>맥파 데이터:</strong></Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={6} md={3}>
                              <Typography sx={{ color: '#dc2626', fontWeight: 600 }}><strong>수축기 혈압:</strong> {selectedPatient.pulseWaveInfo.pulseWave.systolicBP || 'N/A'} mmHg</Typography>
                            </Grid>
                            <Grid item xs={6} md={3}>
                              <Typography sx={{ color: '#2563eb', fontWeight: 600 }}><strong>이완기 혈압:</strong> {selectedPatient.pulseWaveInfo.pulseWave.diastolicBP || 'N/A'} mmHg</Typography>
                            </Grid>
                            <Grid item xs={6} md={3}>
                              <Typography sx={{ color: '#059669', fontWeight: 600 }}><strong>심박수:</strong> {selectedPatient.pulseWaveInfo.pulseWave.heartRate || 'N/A'} bpm</Typography>
                            </Grid>
                            <Grid item xs={6} md={3}>
                              <Typography sx={{ color: '#7c3aed', fontWeight: 600 }}><strong>맥압:</strong> {selectedPatient.pulseWaveInfo.pulseWave.pulsePressure || 'N/A'} mmHg</Typography>
                            </Grid>
                            <Grid item xs={6} md={3}>
                              <Typography><strong>탄성 점수:</strong> {selectedPatient.pulseWaveInfo.pulseWave.elasticityScore || 'N/A'}</Typography>
                            </Grid>
                            <Grid item xs={6} md={3}>
                              <Typography><strong>PVC:</strong> {selectedPatient.pulseWaveInfo.pulseWave.PVC || 'N/A'}</Typography>
                            </Grid>
                            <Grid item xs={6} md={3}>
                              <Typography><strong>BV:</strong> {selectedPatient.pulseWaveInfo.pulseWave.BV || 'N/A'}</Typography>
                            </Grid>
                            <Grid item xs={6} md={3}>
                              <Typography><strong>SV:</strong> {selectedPatient.pulseWaveInfo.pulseWave.SV || 'N/A'}</Typography>
                            </Grid>
                          </Grid>
                        </>
                      )}

                      {selectedPatient.pulseWaveInfo.macSang && (
                        <>
                          <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 600 }}><strong>맥상 분석:</strong></Typography>
                          <Grid container spacing={1}>
                            {Object.entries(selectedPatient.pulseWaveInfo.macSang).map(([key, value]) => {
                              if (typeof value === 'boolean' && value) {
                                return (
                                  <Grid item xs={6} md={3} key={key}>
                                    <Chip 
                                      label={key} 
                                      color="primary" 
                                      size="small" 
                                      variant="outlined"
                                      sx={{ borderColor: '#1e40af', color: '#1e40af' }}
                                    />
                                  </Grid>
                                );
                              }
                              return null;
                            })}
                          </Grid>
                          {selectedPatient.pulseWaveInfo.macSang.notes && (
                            <Typography sx={{ mt: 1 }}>
                              <strong>메모:</strong> {selectedPatient.pulseWaveInfo.macSang.notes}
                            </Typography>
                          )}
                        </>
                      )}

                      {selectedPatient.pulseWaveInfo.pulseAnalysis && (
                        <Typography sx={{ mt: 2 }}>
                          <strong>맥파 분석:</strong> {selectedPatient.pulseWaveInfo.pulseAnalysis}
                        </Typography>
                      )}

                      {selectedPatient.pulseWaveInfo.symptoms && selectedPatient.pulseWaveInfo.symptoms.length > 0 && (
                        <Typography sx={{ mt: 2 }}>
                          <strong>증상:</strong> {selectedPatient.pulseWaveInfo.symptoms.join(', ')}
                        </Typography>
                      )}

                      {selectedPatient.pulseWaveInfo.stress && (
                        <Typography sx={{ mt: 2 }}>
                          <strong>스트레스:</strong> {selectedPatient.pulseWaveInfo.stress}
                        </Typography>
                      )}

                      {selectedPatient.pulseWaveInfo.memo && (
                        <Typography sx={{ mt: 2 }}>
                          <strong>메모:</strong> {selectedPatient.pulseWaveInfo.memo}
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                )}

                {/* 증상 정보 */}
                {selectedPatient.symptoms?.mainSymptoms?.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom sx={{ color: '#1e40af', fontWeight: 700 }}>
                      주요 증상
                    </Typography>
                    <Box sx={{ pl: 2 }}>
                      {selectedPatient.symptoms.mainSymptoms.map((symptom, index) => (
                        <Typography key={index} sx={{ mb: 1 }}>
                          • {symptom.symptom} ({symptom.severity}) - {symptom.duration}
                        </Typography>
                      ))}
                    </Box>
                  </Grid>
                )}

                {/* 복용 약물 */}
                {selectedPatient.medication?.currentMedications?.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom sx={{ color: '#1e40af', fontWeight: 700 }}>
                      현재 복용 약물
                    </Typography>
                    <Box sx={{ pl: 2 }}>
                      {selectedPatient.medication.currentMedications.map((med, index) => (
                        <Typography key={index} sx={{ mb: 1 }}>
                          • {med.name} - {med.dosage} ({med.frequency})
                        </Typography>
                      ))}
                    </Box>
                  </Grid>
                )}

                {/* 진료 기록 수 */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ color: '#1e40af', fontWeight: 700 }}>
                    진료 기록
                  </Typography>
                  <Box sx={{ pl: 2 }}>
                    <Typography sx={{ mb: 2 }}>
                      총 {selectedPatient.medicalRecords?.length || 0}개의 진료 기록이 있습니다.
                    </Typography>
                    
                    {/* 진료 기록 타임라인 */}
                    {selectedPatient.medicalRecords && selectedPatient.medicalRecords.length > 0 && (
                      <Box sx={{ mt: 3 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                          진료 기록 타임라인
                        </Typography>
                        <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                          {selectedPatient.medicalRecords
                            .sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate))
                            .map((record, index) => (
                              <Box 
                                key={record.recordId || index}
                                sx={{ 
                                  border: '1px solid #e5e7eb', 
                                  borderRadius: 2, 
                                  p: 2, 
                                  mb: 2,
                                  background: 'rgba(30, 64, 175, 0.05)',
                                  borderLeft: '4px solid #1e40af'
                                }}
                              >
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                  <Typography sx={{ fontWeight: 600, color: '#1e40af' }}>
                                    {moment(record.visitDate).format('YYYY-MM-DD')} ({record.visitType})
                                  </Typography>
                                  <Chip 
                                    label={`${record.visitNumber || index + 1}번째 방문`} 
                                    size="small"
                                    sx={{ background: 'rgba(30, 64, 175, 0.2)', color: '#1e3a8a' }}
                                  />
                                </Box>
                                
                                {record.symptoms && (
                                  <Typography sx={{ mb: 1, fontSize: '0.9rem' }}>
                                    <strong>증상:</strong> {Array.isArray(record.symptoms) ? record.symptoms.join(', ') : record.symptoms}
                                  </Typography>
                                )}
                                
                                {record.diagnosis && (
                                  <Typography sx={{ mb: 1, fontSize: '0.9rem' }}>
                                    <strong>진단:</strong> {record.diagnosis}
                                  </Typography>
                                )}
                                
                                {record.treatment && (
                                  <Typography sx={{ mb: 1, fontSize: '0.9rem' }}>
                                    <strong>치료:</strong> {record.treatment}
                                  </Typography>
                                )}
                                
                                {record.notes && (
                                  <Typography sx={{ fontSize: '0.9rem', color: '#6b7280' }}>
                                    <strong>메모:</strong> {record.notes}
                                  </Typography>
                                )}
                              </Box>
                            ))}
                        </Box>
                      </Box>
                    )}
                  </Box>
                </Grid>

                {/* 진료 추이 분석 */}
                {selectedPatient.medicalRecords && selectedPatient.medicalRecords.length > 1 && (
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom sx={{ color: '#1e40af', fontWeight: 700 }}>
                      진료 추이 분석
                    </Typography>
                    <Box sx={{ pl: 2 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={6} md={3}>
                          <Box sx={{ textAlign: 'center', p: 2, background: 'rgba(30, 64, 175, 0.1)', borderRadius: 2 }}>
                            <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e40af' }}>
                              {selectedPatient.medicalRecords.length}
                            </Typography>
                            <Typography sx={{ fontSize: '0.9rem', color: '#6b7280' }}>
                              총 방문 횟수
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Box sx={{ textAlign: 'center', p: 2, background: 'rgba(59, 130, 246, 0.1)', borderRadius: 2 }}>
                            <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: '#2563eb' }}>
                              {selectedPatient.medicalRecords.filter(r => r.visitType === '재진').length}
                            </Typography>
                            <Typography sx={{ fontSize: '0.9rem', color: '#6b7280' }}>
                              재진 횟수
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Box sx={{ textAlign: 'center', p: 2, background: 'rgba(245, 158, 11, 0.1)', borderRadius: 2 }}>
                            <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: '#d97706' }}>
                              {(() => {
                                const visits = selectedPatient.medicalRecords.length;
                                const months = moment().diff(moment(selectedPatient.basicInfo?.firstVisitDate), 'months') + 1;
                                return (visits / months).toFixed(1);
                              })()}
                            </Typography>
                            <Typography sx={{ fontSize: '0.9rem', color: '#6b7280' }}>
                              월 평균 방문
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Box sx={{ textAlign: 'center', p: 2, background: 'rgba(239, 68, 68, 0.1)', borderRadius: 2 }}>
                            <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: '#dc2626' }}>
                              {moment().diff(moment(selectedPatient.basicInfo?.lastVisitDate), 'days')}
                            </Typography>
                            <Typography sx={{ fontSize: '0.9rem', color: '#6b7280' }}>
                              마지막 방문 후 일수
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <ActionButton onClick={() => setDetailDialogOpen(false)}>
            닫기
          </ActionButton>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default PatientDataTable; 