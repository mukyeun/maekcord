import React, { useState } from 'react';
import { Modal, Button, message, Steps } from 'antd';
import styled from 'styled-components';
import BasicInfoSection from './BasicInfoSection';
import MedicationSection from './MedicationSection';
import SymptomSection from './SymptomSection';
import StressSection from './StressSection';
import WaveAnalysisSection from './WaveAnalysisSection';
import MemoSection from './MemoSection';

const FormContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
`;

const PatientFormWrapper = ({ visible, onClose }) => {
  const [formData, setFormData] = useState({
    basicInfo: {},
    medication: {},
    symptoms: [],
    stress: [],
    memo: '',
    waveAnalysis: {}
  });

  const [currentStep, setCurrentStep] = useState(0);

  const sections = [
    {
      title: '기본 정보',
      content: <BasicInfoSection 
        data={formData.basicInfo} 
        onChange={(newData) => handleSectionChange('basicInfo', newData)} 
      />
    },
    {
      title: '복용 약물',
      content: <MedicationSection 
        data={formData.medication} 
        onChange={(newData) => handleSectionChange('medication', newData)} 
      />
    },
    {
      title: '증상',
      content: <SymptomSection 
        data={formData.symptoms} 
        onChange={(newData) => handleSectionChange('symptoms', newData)} 
      />
    },
    {
      title: '스트레스',
      content: <StressSection 
        formData={formData} 
        onStressChange={(newData) => handleSectionChange('stress', newData)} 
      />
    },
    {
      title: '맥파 분석',
      content: <WaveAnalysisSection 
        formData={formData} 
        onPulseWaveChange={(newData) => handleSectionChange('waveAnalysis', newData)} 
      />
    },
    {
      title: '메모',
      content: <MemoSection 
        data={formData.memo} 
        onChange={(newData) => handleSectionChange('memo', newData)} 
      />
    }
  ];

  const handleSectionChange = (section, newData) => {
    setFormData(prev => ({
      ...prev,
      [section]: newData
    }));
  };

  const handleNext = () => {
    setCurrentStep(prev => Math.min(prev + 1, sections.length - 1));
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSave = () => {
    // TODO: 데이터 유효성 검사
    try {
      // TODO: API 호출하여 데이터 저장
      message.success('환자 정보가 저장되었습니다.');
      onClose();
    } catch (error) {
      message.error('저장 중 오류가 발생했습니다.');
    }
  };

  return (
    <Modal
      title="환자 정보 입력"
      visible={visible}
      onCancel={onClose}
      width="90%"
      style={{ top: 20 }}
      footer={null}
    >
      <FormContainer>
        <Steps
          current={currentStep}
          onChange={setCurrentStep}
          items={sections.map(section => ({
            title: section.title
          }))}
          style={{ marginBottom: 24 }}
        />

        {sections[currentStep].content}

        <ActionButtons>
          {currentStep > 0 && (
            <Button onClick={handlePrev}>
              이전
            </Button>
          )}
          {currentStep < sections.length - 1 && (
            <Button type="primary" onClick={handleNext}>
              다음
            </Button>
          )}
          {currentStep === sections.length - 1 && (
            <Button type="primary" onClick={handleSave}>
              저장
            </Button>
          )}
        </ActionButtons>
      </FormContainer>
    </Modal>
  );
};

export default PatientFormWrapper;
