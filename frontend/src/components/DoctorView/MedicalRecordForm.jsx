import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  FormControlLabel,
  Checkbox,
  Grid,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import PrintIcon from '@mui/icons-material/Print';
import EditIcon from '@mui/icons-material/Edit';
import { styled } from '@mui/material/styles';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2)
}));

const MedicalRecordForm = ({ patientData, onComplete }) => {
  const [memo, setMemo] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [treatments, setTreatments] = useState({
    acupuncture: false,
    herbalMedicine: false,
    moxibustion: false,
    cupping: false
  });
  const [nextAppointment, setNextAppointment] = useState(null);
  const [isEditing, setIsEditing] = useState(true);
  const [openPreview, setOpenPreview] = useState(false);

  const handleTreatmentChange = (treatment) => {
    setTreatments(prev => ({
      ...prev,
      [treatment]: !prev[treatment]
    }));
  };

  const handleSave = async () => {
    try {
      await onComplete({
        memo,
        diagnosis,
        treatments,
        nextAppointment
      });
      setIsEditing(false);
    } catch (error) {
      console.error('진료 기록 저장 실패:', error);
    }
  };

  const handlePrint = () => {
    setOpenPreview(true);
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString();
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">진료 기록</Typography>
        <Stack direction="row" spacing={1}>
          {!isEditing && (
            <IconButton onClick={() => setIsEditing(true)} color="primary">
              <EditIcon />
            </IconButton>
          )}
          <IconButton onClick={handleSave} color="primary">
            <SaveIcon />
          </IconButton>
          <IconButton onClick={handlePrint} color="primary">
            <PrintIcon />
          </IconButton>
        </Stack>
      </Stack>

      <Stack spacing={3}>
        {/* 진단 메모 */}
        <StyledPaper>
          <Typography variant="subtitle1" gutterBottom>소견</Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            disabled={!isEditing}
            placeholder="진단 소견을 입력하세요..."
          />
        </StyledPaper>

        {/* 진단명 */}
        <StyledPaper>
          <Typography variant="subtitle1" gutterBottom>진단명</Typography>
          <TextField
            fullWidth
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            disabled={!isEditing}
            placeholder="진단명을 입력하세요..."
          />
        </StyledPaper>

        {/* 치료 계획 */}
        <StyledPaper>
          <Typography variant="subtitle1" gutterBottom>치료 계획</Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={treatments.acupuncture}
                    onChange={() => handleTreatmentChange('acupuncture')}
                    disabled={!isEditing}
                  />
                }
                label="침"
              />
            </Grid>
            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={treatments.herbalMedicine}
                    onChange={() => handleTreatmentChange('herbalMedicine')}
                    disabled={!isEditing}
                  />
                }
                label="한약"
              />
            </Grid>
            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={treatments.moxibustion}
                    onChange={() => handleTreatmentChange('moxibustion')}
                    disabled={!isEditing}
                  />
                }
                label="뜸"
              />
            </Grid>
            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={treatments.cupping}
                    onChange={() => handleTreatmentChange('cupping')}
                    disabled={!isEditing}
                  />
                }
                label="부항"
              />
            </Grid>
          </Grid>
        </StyledPaper>

        {/* 다음 예약 */}
        <StyledPaper>
          <Typography variant="subtitle1" gutterBottom>다음 예약</Typography>
          <TextField
            type="date"
            value={nextAppointment}
            onChange={(e) => setNextAppointment(e.target.value)}
            disabled={!isEditing}
            fullWidth
            InputLabelProps={{
              shrink: true,
            }}
          />
        </StyledPaper>
      </Stack>

      {/* 프린트 미리보기 다이얼로그 */}
      <Dialog
        open={openPreview}
        onClose={() => setOpenPreview(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>진료 기록</DialogTitle>
        <DialogContent>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>진료 기록서</Typography>
            <Typography variant="subtitle1" gutterBottom>
              환자명: {patientData?.name}
            </Typography>
            <Typography variant="subtitle1" gutterBottom>
              진료일: {new Date().toLocaleDateString()}
            </Typography>
            <Box sx={{ my: 3 }}>
              <Typography variant="h6" gutterBottom>진단 소견</Typography>
              <Typography>{memo}</Typography>
            </Box>
            <Box sx={{ my: 3 }}>
              <Typography variant="h6" gutterBottom>진단명</Typography>
              <Typography>{diagnosis}</Typography>
            </Box>
            <Box sx={{ my: 3 }}>
              <Typography variant="h6" gutterBottom>치료 계획</Typography>
              {Object.entries(treatments)
                .filter(([_, checked]) => checked)
                .map(([treatment]) => (
                  <Typography key={treatment}>• {treatment}</Typography>
                ))
              }
            </Box>
            <Box sx={{ my: 3 }}>
              <Typography variant="h6" gutterBottom>다음 예약</Typography>
              <Typography>{formatDate(nextAppointment)}</Typography>
            </Box>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPreview(false)}>닫기</Button>
          <Button 
            variant="contained" 
            onClick={() => {
              window.print();
              setOpenPreview(false);
            }}
          >
            인쇄
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MedicalRecordForm; 