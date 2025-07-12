import React, { useState, useEffect, useCallback } from 'react';
import { Card, Grid, Typography, Box, Alert, IconButton } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import RefreshIcon from '@mui/icons-material/Refresh';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useWebSocket } from '../hooks/useWebSocket';

const VitalSignCard = ({ title, value, unit, status, timestamp }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'critical': return 'error';
      case 'warning': return 'warning';
      default: return 'success';
    }
  };

  return (
    <Card sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom>{title}</Typography>
      <Box display="flex" alignItems="baseline" mb={1}>
        <Typography variant="h4" component="span">{value}</Typography>
        <Typography variant="body1" component="span" ml={1}>{unit}</Typography>
      </Box>
      <Alert severity={getStatusColor(status)} sx={{ mt: 1 }}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Alert>
      <Typography variant="caption" display="block" mt={1}>
        마지막 업데이트: {format(new Date(timestamp), 'yyyy-MM-dd HH:mm:ss')}
      </Typography>
    </Card>
  );
};

const VitalSignChart = ({ data, type, unit }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="timestamp"
          tickFormatter={(timestamp) => format(new Date(timestamp), 'HH:mm')}
        />
        <YAxis unit={unit} />
        <Tooltip
          labelFormatter={(timestamp) => format(new Date(timestamp), 'yyyy-MM-dd HH:mm:ss')}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#8884d8"
          activeDot={{ r: 8 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

const PatientDashboard = ({ patientId }) => {
  const [vitalSigns, setVitalSigns] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState(null);
  const { isReady, subscribe } = useWebSocket();

  // WebSocket 이벤트 구독
  useEffect(() => {
    if (!isReady) return;

    const unsubscribe = subscribe('CRITICAL_VITAL_SIGN', (data) => {
      setAlerts(prev => [...prev, data]);
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [isReady, subscribe]);

  // 생체 신호 데이터 가져오기
  const fetchVitalSigns = useCallback(async () => {
    try {
      const response = await fetch(`/api/vital-signs/patient/${patientId}`);
      if (!response.ok) throw new Error('데이터를 가져오는데 실패했습니다.');
      
      const data = await response.json();
      const groupedData = data.reduce((acc, item) => {
        if (!acc[item.type]) {
          acc[item.type] = [];
        }
        acc[item.type].push(item);
        return acc;
      }, {});
      
      setVitalSigns(groupedData);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, [patientId]);

  useEffect(() => {
    fetchVitalSigns();
    const interval = setInterval(fetchVitalSigns, 60000); // 1분마다 갱신
    return () => clearInterval(interval);
  }, [fetchVitalSigns]);

  const handleRefresh = () => {
    fetchVitalSigns();
  };

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">환자 모니터링</Typography>
        <Box>
          <IconButton onClick={() => setAlerts([])} color={alerts.length > 0 ? "error" : "default"}>
            <NotificationsIcon />
            {alerts.length > 0 && (
              <Typography variant="caption" sx={{ position: 'absolute', top: 0, right: 0 }}>
                {alerts.length}
              </Typography>
            )}
          </IconButton>
          <IconButton onClick={handleRefresh}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {!isReady && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          실시간 알림 연결 대기 중...
        </Alert>
      )}

      {alerts.length > 0 && (
        <Box mb={3}>
          {alerts.map((alert, index) => (
            <Alert severity="error" key={index} onClose={() => {
              setAlerts(alerts.filter((_, i) => i !== index));
            }}>
              {`${alert.vitalSignType}: ${alert.value} ${alert.unit} - ${format(new Date(alert.timestamp), 'HH:mm:ss')}`}
            </Alert>
          ))}
        </Box>
      )}

      <Grid container spacing={3}>
        {Object.entries(vitalSigns).map(([type, data]) => {
          const latest = data[0];
          if (!latest) return null;

          return (
            <React.Fragment key={type}>
              <Grid>
                <VitalSignCard
                  title={type.replace('_', ' ').toUpperCase()}
                  value={latest.value}
                  unit={latest.unit}
                  status={latest.status}
                  timestamp={latest.timestamp}
                />
              </Grid>
              <Grid>
                <Card sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    {type.replace('_', ' ').toUpperCase()} 트렌드
                  </Typography>
                  <VitalSignChart
                    data={data}
                    type={type}
                    unit={latest.unit}
                  />
                </Card>
              </Grid>
            </React.Fragment>
          );
        })}
      </Grid>
    </Box>
  );
};

export default PatientDashboard; 