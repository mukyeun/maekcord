import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Typography, Card, CircularProgress, Button, TextField, InputAdornment, Grid } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

function maskResidentNumber(num) {
  if (!num) return '';
  return num.replace(/(\d{6})-(\d{1})\d{6}/, '$1-$2******');
}

export default function SearchResultsPage() {
  const query = useQuery().get('query') || '';
  const [results, setResults] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [search, setSearch] = React.useState(query);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!query) return;
    setLoading(true);
    setError(null);
    fetch(`/api/patients/search?query=${encodeURIComponent(query)}`)
      .then(res => {
        if (!res.ok) throw new Error('검색 실패');
        return res.json();
      })
      .then(data => setResults(Array.isArray(data.patients) ? data.patients : []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [query]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/search?query=${encodeURIComponent(search)}`);
    }
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', pt: 6, px: 2 }}>
      <Typography variant="h4" fontWeight={700} mb={3}>환자 검색 결과</Typography>
      <form onSubmit={handleSearch} style={{ marginBottom: 32 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="환자 이름, 연락처, 주민번호 등으로 검색하세요"
          value={search}
          onChange={e => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </form>
      {loading && <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box>}
      {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
      {!loading && !error && results.length === 0 && (
        <Typography color="text.secondary" sx={{ mb: 2 }}>검색 결과가 없습니다.</Typography>
      )}
      <Grid container spacing={2}>
        {results.map(patient => (
          <Grid key={patient._id}>
            <Card sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" fontWeight={700}>{patient.basicInfo?.name} ({patient.basicInfo?.gender})</Typography>
              <Typography variant="body2">연락처: {patient.basicInfo?.phone}</Typography>
              <Typography variant="body2">주민번호: {maskResidentNumber(patient.basicInfo?.residentNumber)}</Typography>
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Button variant="contained" size="small" onClick={() => navigate(`/patient/edit/${patient._id}`)}>상세보기</Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
} 