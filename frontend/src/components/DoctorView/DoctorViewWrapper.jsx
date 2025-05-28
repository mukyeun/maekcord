import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Spin, message } from 'antd';
import DoctorView from './DoctorView';
import { patientApi } from '../../api/patientApi';

const DoctorViewWrapper = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [patientData, setPatientData] = useState(null);
  const [pulseData, setPulseData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // location.state에서 초기 데이터 확인
        const initialData = location.state?.patientData;
        if (!initialData?._id) {
          message.error('유효하지 않은 접근입니다.');
          navigate('/reception');
          return;
        }

        // 환자 상세 정보 조회
        const response = await patientApi.getPatientById(initialData._id);
        setPatientData(response.data);
        
        // 맥파 데이터 설정
        setPulseData(location.state?.pulseData || {});
      } catch (error) {
        console.error('❌ 환자 정보 조회 실패:', error);
        message.error('환자 정보를 불러오는데 실패했습니다.');
        navigate('/reception');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [location.state, navigate]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="환자 정보를 불러오는 중..." />
      </div>
    );
  }

  return (
    <DoctorView 
      patientData={patientData} 
      pulseData={pulseData}
    />
  );
};

export default DoctorViewWrapper; 