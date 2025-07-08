import React, { useState } from 'react';
import { Layout, Typography, Card, Button, Space } from 'antd';
import PatientSearch from '../components/Common/PatientSearch';
import PatientRegistrationForm from '../components/Reception/PatientRegistrationForm';

const { Content } = Layout;
const { Title } = Typography;

const Reception = () => {
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setShowRegistrationForm(false);
  };

  return (
    <Layout>
      <Content style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
        <Title level={2}>접수실</Title>
        
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Card>
            <Space direction="vertical" style={{ width: '100%' }}>
              <PatientSearch 
                onPatientSelect={handlePatientSelect}
                showRecentPatients={true}
              />
              <Button 
                type="primary" 
                onClick={() => setShowRegistrationForm(true)}
              >
                신규 환자 등록
              </Button>
            </Space>
          </Card>

          {showRegistrationForm && (
            <PatientRegistrationForm />
          )}

          {selectedPatient && !showRegistrationForm && (
            <Card title="환자 정보">
              {/* 선택된 환자 정보 표시 및 접수 처리 UI */}
            </Card>
          )}
        </Space>
      </Content>
    </Layout>
  );
};

export default Reception; 