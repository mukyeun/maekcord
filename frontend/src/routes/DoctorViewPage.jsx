import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import DoctorView from '../components/DoctorView/DoctorView';

const DoctorViewPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useSelector(state => state.auth);
  
  // URL 파라미터에서 patientId 읽어오기
  const searchParams = new URLSearchParams(location.search);
  const patientId = searchParams.get('patientId') || location.state?.patientId;

  console.log('DoctorViewPage - patientId:', patientId); // 디버깅

  // 인증 체크
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleClose = () => {
    navigate('/');
  };

  return (
    <DoctorView 
      visible={true} 
      onClose={handleClose} 
      selectedPatientId={patientId}
      isFullPage={true}
    />
  );
};

export default DoctorViewPage; 