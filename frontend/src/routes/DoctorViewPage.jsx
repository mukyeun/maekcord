import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import DoctorView from '../components/DoctorView/DoctorView';

const DoctorViewPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useSelector(state => state.auth);
  
  // URL 쿼리 파라미터에서 patientId 가져오기
  const queryParams = new URLSearchParams(location.search);
  const patientIdFromQuery = queryParams.get('patientId');
  
  // location.state 또는 URL 쿼리 파라미터에서 patientId 가져오기
  const patientId = location.state?.patientId || patientIdFromQuery;
  
  console.log('🔍 DoctorViewPage - patientId:', patientId);
  console.log('🔍 DoctorViewPage - location.state:', location.state);
  console.log('🔍 DoctorViewPage - location.search:', location.search);

  // 인증 체크
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleClose = () => {
    navigate('/');
  };

  return (
    <div style={{ 
      maxWidth: 1200, 
      margin: '0 auto', 
      padding: 32,
      background: '#fff', 
      borderRadius: 18, 
      boxShadow: '0 4px 24px rgba(24,144,255,0.08)',
      minHeight: 'calc(100vh - 64px)'
    }}>
      <DoctorView 
        visible={true} 
        onClose={handleClose} 
        isFullPage={true}
        selectedPatientId={patientId}
      />
    </div>
  );
};

export default DoctorViewPage; 