import React, { useState, useEffect } from 'react';
import { Modal, Button, message, Steps } from 'antd';
import styled from 'styled-components';
import BasicInfoSection from './BasicInfoSection';
import MedicationSection from './MedicationSection';
import SymptomSection from './SymptomSection';
import StressSection from './StressSection';
import WaveAnalysisSection from './WaveAnalysisSection';
import MemoSection from './MemoSection';
import { savePatientInfo } from '../../api/patientApi';

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

const initialFormData = {
  basicInfo: {},
  medication: {},
  symptoms: [],
  memo: '',
  records: {
    pulseWave: {
      'systolicBP': '',
      'diastolicBP': '',
      'heartRate': '',
      'pulsePressure': '',
      'a-b': '',
      'a-c': '',
      'a-d': '',
      'a-e': '',
      'b/a': '',
      'c/a': '',
      'd/a': '',
      'e/a': '',
      'elasticityScore': '',
      'PVC': '',
      'BV': '',
      'SV': '',
      'lastUpdated': ''
    },
    stress: {
      items: [],
      totalScore: 0,
      level: '',
      description: '',
      details: ''
    }
  }
};

const PatientFormWrapper = ({ visible, onClose, onSuccess }) => {
  const [formData, setFormData] = useState(initialFormData);
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setCurrentStep(0);
      setFormData(initialFormData);
    }
  }, [visible]);

  const handleSectionChange = (section, newData) => {
    console.log(`✏️ Section updated: ${section}`, newData);
    setFormData((prev) => ({
      ...prev,
      [section]: newData
    }));
  };

  const handleNext = () => {
    console.log('➡️ 다음 버튼 클릭됨');
    setCurrentStep((prev) => Math.min(prev + 1, sections.length - 1));
  };

  const handlePrev = () => {
    console.log('⬅️ 이전 버튼 클릭됨');
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // ✅ 1. 데이터 정제
      const { basicInfo, ...rest } = formData;
      const flatSymptoms = Array.isArray(formData.symptoms)
        ? formData.symptoms.flatMap(s => 
            typeof s === 'string' ? [s] : Array.isArray(s?.symptoms) ? s.symptoms : []
          )
        : [];

      // ✅ 2. patientId 제거하고 저장용 데이터 구성
      const sanitizedFormData = {
        ...rest,
        basicInfo: {
          ...basicInfo,
          visitType: basicInfo.visitType || '초진'
        },
        symptoms: flatSymptoms
      };

      // ✅ 3. patientId 명시적 제거
      delete sanitizedFormData.basicInfo.patientId;

      const response = await savePatientInfo(sanitizedFormData);
      console.log('✅ 환자 정보 저장 완료:', response);
      
      message.success('환자 정보가 저장되었습니다.');
      if (typeof onSuccess === 'function') {
        await onSuccess();
      }
      onClose();
    } catch (error) {
      console.error('❌ 저장 실패:', error);
      message.error('저장에 실패했습니다: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const sections = [
    {
      title: '기본 정보',
      content: (
        <BasicInfoSection
          data={formData.basicInfo}
          onChange={(newData) => handleSectionChange('basicInfo', newData)}
        />
      )
    },
    {
      title: '복용 약물',
      content: (
        <MedicationSection
          data={formData.medication}
          onChange={(newData) => handleSectionChange('medication', newData)}
        />
      )
    },
    {
      title: '증상',
      content: (
        <SymptomSection
          data={formData.symptoms}
          onChange={(newData) => handleSectionChange('symptoms', newData)}
        />
      )
    },
    {
      title: '스트레스',
      content: (
        <StressSection
          formData={formData}
          onStressChange={(updatedStress) =>
            setFormData((prev) => ({
              ...prev,
              records: {
                ...prev.records,
                stress: updatedStress
              }
            }))
          }
        />
      )
    },
    {
      title: '맥파 분석',
      content: (
        <WaveAnalysisSection
          formData={formData}
          onPulseWaveChange={(updatedFormData) => setFormData(updatedFormData)}
        />
      )
    },
    {
      title: '메모',
      content: (
        <MemoSection
          data={formData.memo}
          onChange={(newData) => handleSectionChange('memo', newData)}
        />
      )
    }
  ];

  return (
    <Modal
      title="환자 정보 입력"
      open={visible}
      onCancel={onClose}
      width="90%"
      style={{ top: 20 }}
      footer={null}
      destroyOnClose
    >
      <FormContainer>
        <Steps
          current={currentStep}
          onChange={setCurrentStep}
          items={sections.map((section) => ({ title: section.title }))}
          style={{ marginBottom: 24 }}
        />

        {sections[currentStep].content}

        <ActionButtons>
          {currentStep > 0 && (
            <Button onClick={handlePrev} disabled={saving}>
              이전
            </Button>
          )}
          {currentStep < sections.length - 1 ? (
            <Button type="primary" onClick={handleNext} disabled={saving}>
              다음
            </Button>
          ) : (
            <Button 
              type="primary" 
              onClick={handleSave} 
              loading={saving}
              disabled={!formData.basicInfo.name}
            >
              저장
            </Button>
          )}
        </ActionButtons>
      </FormContainer>
    </Modal>
  );
};

export default PatientFormWrapper;
