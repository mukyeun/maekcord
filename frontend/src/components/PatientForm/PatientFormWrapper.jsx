import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Button, message, Steps, Alert, Form, Spin } from 'antd';
import styled from 'styled-components';
import BasicInfoSection from './BasicInfoSection';
import MedicationSection from './MedicationSection';
import SymptomSection from './SymptomSection';
import StressSection from './StressSection';
import WaveAnalysisSection from './WaveAnalysisSection';
import MemoSection from './MemoSection';
import { registerPatient, updatePatient, findPatientByCode, checkPatient } from '../../api/patientApi';
import { registerQueue, deleteQueue, getQueueStatus } from '../../api/queueApi';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('Asia/Seoul');

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

const FormCard = styled.div`
  background: ${({ theme }) => theme.card};
  border-radius: 16px;
  box-shadow: 0 2px 16px rgba(25, 118, 210, 0.08);
  border: 1px solid ${({ theme }) => theme.border};
  padding: 2rem 2rem 1.5rem 2rem;
  margin-bottom: 2rem;
  color: ${({ theme }) => theme.text};
  @media (max-width: 700px) {
    padding: 1rem;
  }
`;

const initialFormData = {
  basicInfo: {
    name: '',
    residentNumber: '',
    gender: '',
    birthDate: '',
    phone: '',
    personality: '',
    workIntensity: '',
    height: null,
    weight: null,
    bmi: null,
    visitType: '초진',
  },
  medication: {
    current: [],
    preferences: [],
  },
  symptoms: [],
  records: {
    pulse: {
      values: {},
      measuredAt: '',
    },
    stress: {
      items: [],
      score: 0,
      level: '',
      measuredAt: '',
    }
  },
  memo: '',
};

const PatientFormWrapper = ({ onClose, onSaveSuccess = () => {}, visible = false, fetchQueue = () => {} }) => {
  const [isModalVisible, setIsModalVisible] = useState(visible);
  const [formData, setFormData] = useState(initialFormData);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    setIsModalVisible(visible);
  }, [visible]);

  useEffect(() => {
    if (isModalVisible) {
      // 모달이 열릴 때 완전히 초기화
      setFormData(initialFormData);
      setCurrentStep(0);
      setError(null);
      form.resetFields && form.resetFields();
    }
  }, [isModalVisible, form]);

  const handleSectionChange = (section, newData) => {
    setFormData((prev) => ({
      ...prev,
      [section]: newData
    }));
  };

  const extractBirthDate = (residentNumber) => {
    if (!residentNumber || residentNumber.length < 7) return null;
    
    const cleanNumber = residentNumber.replace(/-/g, '');
    const year = cleanNumber.substring(0, 2);
    const month = cleanNumber.substring(2, 4);
    const day = cleanNumber.substring(4, 6);
    const genderDigit = cleanNumber.substring(6, 7);
    
    let fullYear;
    if (genderDigit === '1' || genderDigit === '2') {
      fullYear = `19${year}`;
    } else if (genderDigit === '3' || genderDigit === '4') {
      fullYear = `20${year}`;
    } else {
      return null;
    }
    
    return `${fullYear}-${month}-${day}`;
  };

  const validateFormData = (data) => {
    const errors = [];
    
    if (!data.basicInfo?.name) errors.push('이름을 입력해주세요.');
    if (!data.basicInfo?.gender) errors.push('성별을 선택해주세요.');
    if (!data.basicInfo?.residentNumber) errors.push('주민등록번호를 입력해주세요.');
    if (!data.basicInfo?.phone) errors.push('연락처를 입력해주세요.');

    return errors;
  };

  const sanitizeFormData = (data) => {
    const birthDate = extractBirthDate(data.basicInfo?.residentNumber);

    // 기본 정보 정제
    const sanitizedData = {
      basicInfo: {
        name: data.basicInfo?.name || '',
        gender: data.basicInfo?.gender || '',
        birthDate: birthDate || '',
        phone: data.basicInfo?.phone || '',
        residentNumber: data.basicInfo?.residentNumber || '',
        personality: data.basicInfo?.personality || '',
        workIntensity: data.basicInfo?.workIntensity || '',
        height: Number(data.basicInfo?.height) || null,
        weight: Number(data.basicInfo?.weight) || null,
        bmi: Number(data.basicInfo?.bmi) || null,
        visitType: data.basicInfo?.visitType || '초진'
      },
      
      // 의료 정보 정제 (필드명 변경)
      medication: {
        current: Array.isArray(data.medication?.current)
          ? data.medication.current.filter(Boolean).map(m => m.trim())
          : [],
        preferences: Array.isArray(data.medication?.preferences)
          ? data.medication.preferences.filter(Boolean).map(p => p.trim())
          : []
      },

      // 스트레스 정보 정제
      stress: data.stress
        ? {
            level: data.stress.level || 'normal',
            score: Number(data.stress.totalScore || data.stress.score || 0),
            items: Array.isArray(data.stress.items)
              ? data.stress.items.map(item => 
                  typeof item === 'string' ? item : (item.name || '')
                ).filter(Boolean)
              : [],
            measuredAt: data.stress.measuredAt || new Date()
          }
        : null,

      // 맥파 정보 정제 - pulseWave로 변경
      records: {
        pulseWave: data.records?.pulseWave
          ? {
              systolicBP: Number(data.records.pulseWave.systolicBP) || 0,
              diastolicBP: Number(data.records.pulseWave.diastolicBP) || 0,
              heartRate: Number(data.records.pulseWave.heartRate) || 0,
              pulsePressure: Number(data.records.pulseWave.pulsePressure) || 0,
              'a-b': Number(data.records.pulseWave['a-b']) || 0,
              'a-c': Number(data.records.pulseWave['a-c']) || 0,
              'a-d': Number(data.records.pulseWave['a-d']) || 0,
              'a-e': Number(data.records.pulseWave['a-e']) || 0,
              'b/a': Number(data.records.pulseWave['b/a']) || 0,
              'c/a': Number(data.records.pulseWave['c/a']) || 0,
              'd/a': Number(data.records.pulseWave['d/a']) || 0,
              'e/a': Number(data.records.pulseWave['e/a']) || 0,
              elasticityScore: Number(data.records.pulseWave.elasticityScore) || 0,
              PVC: Number(data.records.pulseWave.PVC) || 0,
              BV: Number(data.records.pulseWave.BV) || 0,
              SV: Number(data.records.pulseWave.SV) || 0,
              lastUpdated: data.records.pulseWave.lastUpdated || new Date()
            }
          : null,
      },

      // 증상 정보 정제
      symptoms: Array.isArray(data.symptoms) 
        ? data.symptoms.filter(Boolean).map(s => s.trim())
        : [],
      
      // 메모 정제
      memo: (data.memo || '').trim(),
      
      // 메타데이터
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'active'
      }
    };

    // records[0]에 약물 정보도 포함
    const initialRecord = {};
    if (Array.isArray(sanitizedData.symptoms)) initialRecord.symptoms = sanitizedData.symptoms;
    if (sanitizedData.memo) initialRecord.memo = sanitizedData.memo;
    if (Array.isArray(sanitizedData.medication.current)) initialRecord.medications = sanitizedData.medication.current;
    if (Array.isArray(sanitizedData.medication.preferences)) initialRecord.preferences = sanitizedData.medication.preferences;
    if (data.records?.pulseWave) initialRecord.pulseWave = sanitizedData.records.pulseWave;
    if (data.records?.macSang) initialRecord.macSang = sanitizedData.records.macSang;
    if (sanitizedData.stress) initialRecord.stress = sanitizedData.stress;

    sanitizedData.records = Object.keys(initialRecord).length > 0 ? [initialRecord] : [];

    // 반드시 아래처럼 반환!
    return {
      ...sanitizedData,
      medication: sanitizedData.medication,
      symptoms: sanitizedData.symptoms,
      records: sanitizedData.records
    };
  };

  const extractPatientId = (response) => {
    if (!response?.data) return null;
    
    const { data } = response;
    
    if (data.patientId) return data.patientId;
    if (data.patient?._id) return data.patient._id;
    if (data._id) return data._id;
    
    return null;
  };

  const handleSave = async () => {
    // 저장 버튼 클릭 시 formData를 콘솔에 출력
    console.log('[PatientFormWrapper] 저장 직전 formData:', formData);
    console.log('[PatientFormWrapper] 저장 직전 formData.stress:', formData.stress);
    try {
      const errors = validateFormData(formData);
      if (errors.length > 0) {
        errors.forEach(err => message.warning(err));
        return;
      }
      console.log('🟡 저장 시작 - 폼 데이터:', formData);

      console.log('🔍 스트레스 데이터:', {
        stressData: formData.stress,
        totalScore: formData.stress?.totalScore,
        score: formData.stress?.score
      });

      const sanitized = sanitizeFormData(formData);
      console.log("🧼 정제 후 데이터:", sanitized);
      const res = await registerPatient(sanitized);

      let patientId;
      if (res.success === false && res.patientId) {
        // 이미 등록된 환자인 경우, 주민번호로 checkPatient 호출
        const checkResponse = await checkPatient(sanitized.basicInfo.residentNumber);
        console.log('checkPatient 응답:', checkResponse);
        if (!checkResponse.success || !checkResponse.data || !checkResponse.data._id) {
          throw new Error("환자 ID를 찾을 수 없습니다");
        }
        patientId = checkResponse.data._id;
        
        // 환자 정보 업데이트 시도
        try {
          // basicInfo와 records 모두 업데이트하도록 수정
          await updatePatient(patientId, { basicInfo: sanitized.basicInfo, records: sanitized.records });
        } catch (updateError) {
          console.warn('⚠️ 환자 정보 업데이트 실패:', updateError);
          // 업데이트 실패해도 계속 진행
        }
      } else {
        // 새로 등록된 환자인 경우
        patientId = res?.data?.patientId || res?.data?._id || res?._id;
      }

      if (!patientId) {
        throw new Error("환자 ID를 받아오지 못했습니다");
      }

      console.log('✅ 등록된 환자 ID:', patientId);

      // 대기열 등록 시도
      try {
        // 오늘 날짜를 YYYY-MM-DD로
        const todayStr = dayjs().format('YYYY-MM-DD');
        // 기존 대기열 확인
        const existingQueue = await getQueueStatus(patientId, todayStr);
        
        if (existingQueue.exists) {
          // 사용자에게 확인
          const shouldUpdate = window.confirm(
            '이미 같은 날짜에 등록된 대기열이 있습니다. 최신 정보로 업데이트하시겠습니까?'
          );
          
          if (shouldUpdate) {
            // 기존 대기열 삭제
            await deleteQueue(existingQueue.data._id);
            console.log('🗑️ 기존 대기열 삭제 완료');
          } else {
            throw new Error('사용자가 업데이트를 취소했습니다.');
          }
        }

        // 새로운 대기열 등록
        const queueData = {
          patientId,
          visitType: formData.basicInfo?.visitType || '초진',
          symptoms: formData.symptoms || [],
          date: dayjs().format('YYYY-MM-DD'), // 반드시 YYYY-MM-DD
        };

        const queueResponse = await registerQueue(queueData);
        console.log('✅ 대기열 등록 성공:', queueResponse);
        
        // 성공 메시지 표시
        message.success('환자 정보가 저장되었습니다.');
        
        // 완전한 초기화
        setFormData(initialFormData);
        setCurrentStep(0);
        setError(null);
        form.resetFields && form.resetFields();
        
        onSaveSuccess();
        
        // 약간의 지연 후 모달 닫기 (초기화가 완료되도록)
        setTimeout(() => {
          handleClose();
        }, 100);
        
        fetchQueue();

      } catch (queueError) {
        if (queueError.message === '사용자가 업데이트를 취소했습니다.') {
          message.info('대기열 등록이 취소되었습니다.');
        } else {
          console.error('❌ 대기열 등록 실패:', queueError);
          message.error(queueError.message || '대기열 등록 중 오류가 발생했습니다.');
        }
      }

    } catch (error) {
      console.error('❌ 저장 실패:', error);
      message.error(error.message || '저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ 대기열 상태 번역 함수 개선
  const translateQueueStatus = (status) => {
    const statusMap = {
      waiting: '대기 중',
      called: '호출됨',
      consulting: '진료 중',
      done: '완료',
      cancelled: '취소됨'
    };
    return statusMap[status] || status;
  };

  const hasUnsavedChanges = () => {
    return (
      Object.values(formData.basicInfo).some(value => value !== '') ||
      (formData.symptoms?.symptoms?.length > 0) ||
      Object.values(formData.medication).some(arr => arr?.length > 0) ||
      formData.memo !== '' ||
      Object.values(formData.records?.pulseWave || {}).some(v => v !== '') ||
      (formData.records?.stress?.items?.length > 0)
    );
  };

  const handleClose = useCallback(() => {
    // 모달을 닫을 때도 완전히 초기화
    setFormData(initialFormData);
    setCurrentStep(0);
    setError(null);
    form.resetFields && form.resetFields();
    
    setIsModalVisible(false);
    if (typeof onClose === 'function') {
      onClose();
    }
  }, [onClose, form]);

  const handleExit = () => {
    if (hasUnsavedChanges()) {
      Modal.confirm({
        title: '작성 중인 내용이 있습니다',
        content: '저장하지 않고 나가시겠습니까?',
        okText: '나가기',
        cancelText: '계속 작성',
        onOk: () => {
          handleClose();
          if (window.location.pathname !== '/') {
            window.location.href = '/';
          }
        }
      });
    } else {
      handleClose();
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
  };

  const handleCancel = useCallback((e) => {
    e?.stopPropagation();
    e?.preventDefault();
    
    if (hasUnsavedChanges()) {
      Modal.confirm({
        title: '작성 중인 내용이 있습니다',
        content: '저장하지 않고 나가시겠습니까?',
        okText: '나가기',
        cancelText: '계속 작성',
        onOk: () => {
          // 취소 시에도 완전히 초기화
          setFormData(initialFormData);
          setCurrentStep(0);
          setError(null);
          form.resetFields && form.resetFields();
          handleClose();
        }
      });
    } else {
      // 변경사항이 없어도 초기화
      setFormData(initialFormData);
      setCurrentStep(0);
      setError(null);
      form.resetFields && form.resetFields();
      handleClose();
    }
  }, [handleClose, form]);

  // onStressChange를 useCallback으로 메모이제이션
  const handleStressChange = (newStress) => {
    setFormData(prev => ({
      ...prev,
      stress: newStress
    }));
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
          onChange={(newSymptoms) => handleSectionChange('symptoms', newSymptoms)}
        />
      )
    },
    {
      title: '스트레스',
      content: (
        <StressSection
          formData={formData}
          onStressChange={handleStressChange}
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

  // Save button enable condition - 이름만 필수, 메모는 선택사항
  const isSaveButtonEnabled = currentStep === sections.length - 1 && formData.basicInfo.name;

  return (
    <FormCard>
      <Modal
        title="환자 정보 입력"
        open={isModalVisible}
        onCancel={handleExit}
        width="90%"
        style={{ top: 20 }}
        footer={null}
        destroyOnClose={true}
        maskClosable={false}
        keyboard={true}
        styles={{
          body: { maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }
        }}
      >
        {error && (
          <Alert message="오류" description={error} type="error" showIcon style={{ marginBottom: 16 }} />
        )}
        <Spin spinning={loading} tip="불러오는 중...">
          <Form form={form}>
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
                  <Button onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 0))} disabled={loading}>
                    이전
                  </Button>
                )}
                {currentStep < sections.length - 1 ? (
                  <Button type="primary" onClick={() => setCurrentStep((prev) => Math.min(prev + 1, sections.length - 1))} disabled={loading}>
                    다음
                  </Button>
                ) : (
                  <Button 
                    type="primary"
                    onClick={handleSave}
                    loading={loading}
                    disabled={!isSaveButtonEnabled}
                  >
                    저장하기
                  </Button>
                )}
              </ActionButtons>
            </FormContainer>
          </Form>
        </Spin>
      </Modal>
    </FormCard>
  );
};

export default React.memo(PatientFormWrapper);