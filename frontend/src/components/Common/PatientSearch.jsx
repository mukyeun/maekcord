import React, { useState } from 'react';
import { Input, Select, Space, message, Card } from 'antd';
import { SearchOutlined, UserOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const { Search } = Input;

const SearchContainer = styled(Card)`
  margin-bottom: 16px;
  
  .ant-card-body {
    padding: 16px;
  }
`;

const PatientSearch = ({ onPatientSelect, showRecentPatients = true }) => {
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState([]);
  const [recentPatients, setRecentPatients] = useState([]);
  const navigate = useNavigate();

  console.log('PatientSearch rendered');

  // 환자 검색 함수
  const handleSearch = async (value) => {
    if (!value.trim()) {
      message.warning('검색어를 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`/api/patients/data`, {
        params: {
          search: value,
          limit: 10,
          page: 1
        }
      });
      
      if (response.data.success) {
        const patientList = response.data.patients || [];
        setPatients(patientList);
        if (patientList.length === 0) {
          message.info('검색 결과가 없습니다.');
        }
      } else {
        message.error(response.data.message || '환자 검색 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('환자 검색 실패:', error);
      message.error(error.response?.data?.message || '환자 검색 중 오류가 발생했습니다.');
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  // 환자 선택 처리
  const handlePatientSelect = (patientId) => {
    console.log('handlePatientSelect called:', patientId);
    const selectedPatient = patients.find(p => p._id === patientId);
    if (selectedPatient) {
      console.log('Selected patient:', selectedPatient);
      
      // 최근 환자 목록에 추가
      if (showRecentPatients) {
        const updatedRecentPatients = [
          selectedPatient,
          ...recentPatients.filter(p => p._id !== patientId)
        ].slice(0, 5); // 최근 5명만 유지
        setRecentPatients(updatedRecentPatients);
      }
      
      // 상위 컴포넌트에 선택된 환자 정보 전달 또는 진료실로 이동
      if (onPatientSelect) {
        onPatientSelect(selectedPatient);
      } else {
        navigate('/doctor', { 
          state: { 
            patientId: patientId,
            showDoctorView: true
          }
        });
      }
    }
  };

  return (
    <SearchContainer>
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Search
          placeholder="환자 이름 또는 ID를 입력하세요"
          enterButton={<SearchOutlined />}
          size="large"
          loading={loading}
          onSearch={handleSearch}
          prefix={<UserOutlined />}
        />
        
        {patients.length > 0 && (
          <Select
            style={{ width: '100%' }}
            placeholder="환자를 선택하세요"
            onChange={handlePatientSelect}
            loading={loading}
            options={patients.map(patient => ({
              value: patient._id,
              label: `${patient.basicInfo?.name || ''} (${patient.basicInfo?.patientId || ''})`
            }))}
          />
        )}

        {showRecentPatients && recentPatients.length > 0 && (
          <div>
            <h4>최근 조회한 환자</h4>
            <Select
              style={{ width: '100%' }}
              placeholder="최근 조회한 환자"
              onChange={handlePatientSelect}
              options={recentPatients.map(patient => ({
                value: patient._id,
                label: `${patient.basicInfo?.name || ''} (${patient.basicInfo?.patientId || ''})`
              }))}
            />
          </div>
        )}
      </Space>
    </SearchContainer>
  );
};

export default PatientSearch; 