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
  Checkbox
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import moment from 'moment';

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
    navigate('/');
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
        console.log('테이블 row 데이터:', params.row);
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
        console.log('테이블 row 데이터:', params.row);
        return renderTruncatedCell(params.value);
      },
    },
    {
      field: 'pulseAnalysis',
      headerName: '맥파분석',
      flex: 1.5,
      valueGetter: (params) => params.row.pulseWaveInfo?.pulseAnalysis?.text || 'N/A',
      renderCell: (params) => {
        console.log('테이블 row 데이터:', params.row);
        const pulseWaveText = params.row.pulseWaveInfo?.pulseWave
          ? [
              `수축기:${params.row.pulseWaveInfo.pulseWave.systolicBP ?? 'N/A'}`,
              `이완기:${params.row.pulseWaveInfo.pulseWave.diastolicBP ?? 'N/A'}`,
              `심박수:${params.row.pulseWaveInfo.pulseWave.heartRate ?? 'N/A'}`,
              `맥압:${params.row.pulseWaveInfo.pulseWave.pulsePressure ?? 'N/A'}`,
              `a-b:${params.row.pulseWaveInfo.pulseWave['a-b'] ?? 'N/A'}`,
              `a-c:${params.row.pulseWaveInfo.pulseWave['a-c'] ?? 'N/A'}`,
              `a-d:${params.row.pulseWaveInfo.pulseWave['a-d'] ?? 'N/A'}`,
              `a-e:${params.row.pulseWaveInfo.pulseWave['a-e'] ?? 'N/A'}`,
              `b/a:${params.row.pulseWaveInfo.pulseWave['b/a'] ?? 'N/A'}`,
              `c/a:${params.row.pulseWaveInfo.pulseWave['c/a'] ?? 'N/A'}`,
              `d/a:${params.row.pulseWaveInfo.pulseWave['d/a'] ?? 'N/A'}`,
              `e/a:${params.row.pulseWaveInfo.pulseWave['e/a'] ?? 'N/A'}`,
              `탄성:${params.row.pulseWaveInfo.pulseWave.elasticityScore ?? 'N/A'}`
            ].join(', ')
          : 'N/A';
        return renderTruncatedCell(pulseWaveText, 50);
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
    <Box sx={{ p: 3 }}>
      {/* 헤더 영역 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          환자 데이터 관리
        </Typography>
        <Button
          variant="outlined"
          startIcon={<CloseIcon />}
          onClick={handleClose}
        >
          닫기
        </Button>
      </Box>

      {/* 메시지 표시 */}
      {message.text && (
        <Alert 
          severity={message.type} 
          sx={{ mb: 2 }}
          onClose={() => setMessage({ type: '', text: '' })}
        >
          {message.text}
        </Alert>
      )}

      {/* 검색 및 필터 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="검색 (이름, ID, 전화번호)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                InputProps={{
                  endAdornment: (
                    <IconButton onClick={handleSearch}>
                      <SearchIcon />
                    </IconButton>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
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
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
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
              </FormControl>
            </Grid>
            <Grid item xs={12} md={5}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<FilterIcon />}
                  onClick={handleResetFilters}
                >
                  필터 초기화
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={fetchPatients}
                >
                  새로고침
                </Button>
                <Button
                  variant="contained"
                  startIcon={exportLoading ? <CircularProgress size={20} /> : <DownloadIcon />}
                  onClick={handleExportData}
                  disabled={exportLoading}
                >
                  엑셀 내보내기
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleDeleteSelected}
                  disabled={selectedIds.length === 0}
                >
                  선택 삭제
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 환자 데이터 테이블 */}
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="환자 데이터 테이블">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={selectedIds.length > 0 && selectedIds.length < patients.length}
                  checked={patients.length > 0 && selectedIds.length === patients.length}
                  onChange={handleSelectAll}
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
              <TableCell>맥파분석</TableCell>
              <TableCell>메모</TableCell>
              <TableCell>상태</TableCell>
              <TableCell>작업</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : patients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  환자 데이터가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              patients.map((patient) => {
                if (patient.basicInfo?.name === '박종화') {
                  console.log('박종화 pulseWaveInfo:', patient.pulseWaveInfo);
                }
                console.log('환자 row 데이터:', patient);
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

                const pulseWaveText = patient.pulseWaveInfo?.pulseWave
                  ? [
                      `수축기:${patient.pulseWaveInfo.pulseWave.systolicBP ?? 'N/A'}`,
                      `이완기:${patient.pulseWaveInfo.pulseWave.diastolicBP ?? 'N/A'}`,
                      `심박수:${patient.pulseWaveInfo.pulseWave.heartRate ?? 'N/A'}`,
                      `맥압:${patient.pulseWaveInfo.pulseWave.pulsePressure ?? 'N/A'}`,
                      `a-b:${patient.pulseWaveInfo.pulseWave['a-b'] ?? 'N/A'}`,
                      `a-c:${patient.pulseWaveInfo.pulseWave['a-c'] ?? 'N/A'}`,
                      `a-d:${patient.pulseWaveInfo.pulseWave['a-d'] ?? 'N/A'}`,
                      `a-e:${patient.pulseWaveInfo.pulseWave['a-e'] ?? 'N/A'}`,
                      `b/a:${patient.pulseWaveInfo.pulseWave['b/a'] ?? 'N/A'}`,
                      `c/a:${patient.pulseWaveInfo.pulseWave['c/a'] ?? 'N/A'}`,
                      `d/a:${patient.pulseWaveInfo.pulseWave['d/a'] ?? 'N/A'}`,
                      `e/a:${patient.pulseWaveInfo.pulseWave['e/a'] ?? 'N/A'}`,
                      `탄성:${patient.pulseWaveInfo.pulseWave.elasticityScore ?? 'N/A'}`
                    ].join(', ')
                  : 'N/A';

                const analysisText = patient.pulseWaveInfo?.pulseAnalysis || 'N/A';
                const memoText = patient.pulseWaveInfo?.memo || patient.symptoms?.symptomMemo || 'N/A';
                
                return (
                  <TableRow key={patient._id} hover selected={selectedIds.includes(patient._id)}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedIds.includes(patient._id)}
                        onChange={() => handleSelectOne(patient._id)}
                      />
                    </TableCell>
                    <TableCell>{patient.basicInfo?.patientId}</TableCell>
                    <TableCell>{patient.basicInfo?.name}</TableCell>
                    <TableCell>{getGenderDisplay(patient.basicInfo?.gender)}</TableCell>
                    <TableCell>{patient.age || 'N/A'}</TableCell>
                    <TableCell>{patient.basicInfo?.phone || 'N/A'}</TableCell>
                    <TableCell>{patient.basicInfo?.visitType}</TableCell>
                    <TableCell>{patient.basicInfo?.visitCount}</TableCell>
                    <TableCell>
                      {patient.basicInfo?.lastVisitDate
                        ? moment(patient.basicInfo.lastVisitDate).format('YYYY-MM-DD')
                        : 'N/A'}
                    </TableCell>
                    <TableCell>{renderTruncatedCell(medicationText)}</TableCell>
                    <TableCell>{renderTruncatedCell(symptomsText)}</TableCell>
                    <TableCell>{renderTruncatedCell(stressText)}</TableCell>
                    <TableCell>{renderTruncatedCell(pulseWaveText, 50)}</TableCell>
                    <TableCell>{renderTruncatedCell(memoText)}</TableCell>
                    <TableCell>
                      <Chip 
                        label={statusInfo.label} 
                        color={statusInfo.color} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleViewPatient(patient._id)}
                        title="상세보기"
                      >
                        <ViewIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 페이지네이션 */}
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
      />

      {/* 환자 상세 정보 다이얼로그 */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          환자 상세 정보 - {selectedPatient?.basicInfo?.name}
        </DialogTitle>
        <DialogContent>
          {selectedPatient && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                {/* 기본 정보 */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>기본 정보</Typography>
                  <Box sx={{ pl: 2 }}>
                    <Typography><strong>환자 ID:</strong> {selectedPatient.basicInfo.patientId}</Typography>
                    <Typography><strong>이름:</strong> {selectedPatient.basicInfo.name}</Typography>
                    <Typography><strong>성별:</strong> {getGenderDisplay(selectedPatient.basicInfo.gender)}</Typography>
                    <Typography><strong>나이:</strong> {selectedPatient.age || 'N/A'}</Typography>
                    <Typography><strong>전화번호:</strong> {selectedPatient.basicInfo.phone || 'N/A'}</Typography>
                    <Typography><strong>방문 유형:</strong> {selectedPatient.basicInfo.visitType}</Typography>
                    <Typography><strong>방문 횟수:</strong> {selectedPatient.basicInfo.visitCount}</Typography>
                    <Typography><strong>첫 방문일:</strong> {moment(selectedPatient.basicInfo.firstVisitDate).format('YYYY-MM-DD')}</Typography>
                    <Typography><strong>마지막 방문일:</strong> {moment(selectedPatient.basicInfo.lastVisitDate).format('YYYY-MM-DD')}</Typography>
                  </Box>
                </Grid>

                {/* 신체 정보 */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>신체 정보</Typography>
                  <Box sx={{ pl: 2 }}>
                    <Typography><strong>신장:</strong> {selectedPatient.basicInfo.height ? `${selectedPatient.basicInfo.height}cm` : 'N/A'}</Typography>
                    <Typography><strong>체중:</strong> {selectedPatient.basicInfo.weight ? `${selectedPatient.basicInfo.weight}kg` : 'N/A'}</Typography>
                    <Typography><strong>BMI:</strong> {selectedPatient.basicInfo.bmi || 'N/A'}</Typography>
                    <Typography><strong>직업:</strong> {selectedPatient.basicInfo.occupation || 'N/A'}</Typography>
                    <Typography><strong>작업 강도:</strong> {selectedPatient.basicInfo.workIntensity || 'N/A'}</Typography>
                  </Box>
                </Grid>

                {/* 맥파 분석 정보 */}
                {selectedPatient.pulseWaveInfo && (
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>맥파 분석 정보</Typography>
                    <Box sx={{ pl: 2 }}>
                      <Typography><strong>측정일:</strong> {moment(selectedPatient.pulseWaveInfo.date).format('YYYY-MM-DD HH:mm')}</Typography>
                      
                      {selectedPatient.pulseWaveInfo.pulseWave && (
                        <>
                          <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}><strong>맥파 데이터:</strong></Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={6} md={3}>
                              <Typography><strong>수축기 혈압:</strong> {selectedPatient.pulseWaveInfo.pulseWave.systolicBP || 'N/A'} mmHg</Typography>
                            </Grid>
                            <Grid item xs={6} md={3}>
                              <Typography><strong>이완기 혈압:</strong> {selectedPatient.pulseWaveInfo.pulseWave.diastolicBP || 'N/A'} mmHg</Typography>
                            </Grid>
                            <Grid item xs={6} md={3}>
                              <Typography><strong>심박수:</strong> {selectedPatient.pulseWaveInfo.pulseWave.heartRate || 'N/A'} bpm</Typography>
                            </Grid>
                            <Grid item xs={6} md={3}>
                              <Typography><strong>맥압:</strong> {selectedPatient.pulseWaveInfo.pulseWave.pulsePressure || 'N/A'} mmHg</Typography>
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
                          <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}><strong>맥상 분석:</strong></Typography>
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
                    <Typography variant="h6" gutterBottom>주요 증상</Typography>
                    <Box sx={{ pl: 2 }}>
                      {selectedPatient.symptoms.mainSymptoms.map((symptom, index) => (
                        <Typography key={index}>
                          • {symptom.symptom} ({symptom.severity}) - {symptom.duration}
                        </Typography>
                      ))}
                    </Box>
                  </Grid>
                )}

                {/* 복용 약물 */}
                {selectedPatient.medication?.currentMedications?.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>현재 복용 약물</Typography>
                    <Box sx={{ pl: 2 }}>
                      {selectedPatient.medication.currentMedications.map((med, index) => (
                        <Typography key={index}>
                          • {med.name} - {med.dosage} ({med.frequency})
                        </Typography>
                      ))}
                    </Box>
                  </Grid>
                )}

                {/* 진료 기록 수 */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>진료 기록</Typography>
                  <Box sx={{ pl: 2 }}>
                    <Typography>
                      총 {selectedPatient.medicalRecords?.length || 0}개의 진료 기록이 있습니다.
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>닫기</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PatientDataTable; 