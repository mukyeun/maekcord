import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import ReceptionDashboard from '../components/ReceptionDashboard/ReceptionDashboard';

const ReceptionDashboardPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector(state => state.auth);

  // 인증 체크
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleClose = () => {
    navigate('/');
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 32 }}>
      <ReceptionDashboard visible={true} onClose={handleClose} />
    </div>
  );
};

export default ReceptionDashboardPage; 