import React, { useState, useEffect } from 'react';
import { Modal, Tabs, Card, Tag, Space, Button, Input, message, Spin, Form, Select, Alert, Descriptions, Row, Col, Divider, Switch, Typography } from 'antd';
import { FileTextOutlined, SaveOutlined, UserOutlined, HeartOutlined, MedicineBoxOutlined, BookOutlined, HistoryOutlined, CompareOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import * as queueApi from '../../api/queueApi';
import * as pulseApi from '../../api/pulseApi';
import { wsClient } from '../../utils/websocket';
import { 증상카테고리 } from '../../data/symptoms';
import PulseVisualization from './PulseVisualization';
import MedicalHistoryComparison from './MedicalHistoryComparison';

const { TabPane } = Tabs;
const { TextArea } = Input;
const { Text } = Typography;

const StyledCard = styled(Card)`
  margin-bottom: 16px;
`;

const PulseAnalysisCard = styled(Card)`
  margin-bottom: 16px;
  .ant-card-head {
    background-color: #f0f8ff;
  }
`;

const MacSangCard = styled(Card)`
  margin-bottom: 16px;
  .ant-card-head {
    background-color: #fff0f6;
  }
`;

const HistoryButton = styled(Button)`
  margin-left: 8px;
  background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
  border: none;
  color: white;
  
  &:hover {
    background: linear-gradient(135deg, #1e3a8a 0%, #1e1b4b 100%);
    color: white;
  }
`;

const DoctorView = ({ visible, onClose }) => {
  const [currentPatient, setCurrentPatient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('1');
  const [symptoms, setSymptoms] = useState([]);
  const [memo, setMemo] = useState('');
  const [stress, setStress] = useState('');
  const [pulseAnalysis, setPulseAnalysis] = useState('');
  const [status, setStatus] = useState('waiting');
  const [medication, setMedication] = useState([]);
  const [error, setError] = useState(null);
  const [showHistoryComparison, setShowHistoryComparison] = useState(false);
  
  const [pulseData, setPulseData] = useState({
    systolicBP: '', diastolicBP: '', heartRate: '', pulsePressure: '',
    'a-b': '', 'a-c': '', 'a-d': '', 'a-e': '', 'b/a': '', 'c/a': '', 'd/a': '', 'e/a': '',
    elasticityScore: '', PVC: '', BV: '', SV: '', HR: ''
  });
  
  const getBasicInfoData = (patient) => {
    if (!patient?.patientId?.basicInfo) return [];
    return [
      { label: '이름', value: patient.patientId.basicInfo.name || '-' },
      { label: '주민번호', value: patient.patientId.basicInfo.residentNumber || '-' },
      { label: '연락처', value: patient.patientId.basicInfo.phone || '-' },
      { label: '성별', value: patient.patientId.basicInfo.gender === 'male' ? '남성' : patient.patientId.basicInfo.gender === 'female' ? '여성' : '-' },
      { label: '성격', value: patient.patientId.basicInfo.personality || '-' },
      { label: '노동강도', value: patient.patientId.basicInfo.workIntensity || '-' },
      { label: '신장', value: patient.patientId.basicInfo.height ? `${patient.patientId.basicInfo.height}cm` : '-' },
      { label: '체중', value: patient.patientId.basicInfo.weight ? `${patient.patientId.basicInfo.weight}kg` : '-' },
      { label: 'BMI', value: patient.patientId.basicInfo.bmi || '-' },
      { label: '대기번호', value: patient.queueNumber || '-' },
      { label: '접수시간', value: patient.registeredAt ? new Date(patient.registeredAt).toLocaleString('ko-KR') : '-' }
    ];
  };

  const symptomOptions = Object.entries(증상카테고리).flatMap(([category, subCategories]) =>
    Object.entries(subCategories).flatMap(([subCategory, symptoms]) =>
      symptoms.map(symptom => ({
        label: `${category} > ${subCategory} > ${symptom.name}`,
        value: symptom.name
      }))
    )
  );

  const loadCurrentPatient = async () => {
    try {
      setLoading(true);
      setError(null);
      const todayQueueListResponse = await queueApi.getTodayQueueList();
      const queueList = todayQueueListResponse.data || [];
      
      console.log('🩺 loadCurrentPatient - 큐 목록:', queueList.map(q => ({
        id: q._id,
        name: q.patientId?.basicInfo?.name,
        status: q.status,
        queueNumber: q.queueNumber,
        calledAt: q.calledAt
      })));
      
      // 먼저 호출된 환자 확인 (가장 최근에 호출된 환자)
      const calledQueues = queueList.filter(q => q.status === 'called');
      if (calledQueues.length > 0) {
        // 가장 최근에 호출된 환자를 선택
        const latestCalledQueue = calledQueues.reduce((latest, current) => {
          const latestTime = new Date(latest.calledAt || latest.updatedAt || 0);
          const currentTime = new Date(current.calledAt || current.updatedAt || 0);
          return currentTime > latestTime ? current : latest;
        });
        
        console.log('🩺 호출된 환자 발견:', {
          name: latestCalledQueue.patientId?.basicInfo?.name,
          queueNumber: latestCalledQueue.queueNumber,
          calledAt: latestCalledQueue.calledAt
        });
        
        setCurrentPatient(latestCalledQueue);
        setStatus('called');
        return;
      }
      
      // 진료 중인 환자 확인 (가장 최근에 진료를 시작한 환자)
      const consultingList = queueList.filter(q => q.status === 'consulting');
      if (consultingList.length > 0) {
        // 가장 최근에 진료를 시작한 환자를 선택 (updatedAt 기준)
        const latestConsultingQueue = consultingList.reduce((latest, current) => {
          const latestTime = new Date(latest.updatedAt || latest.createdAt || 0);
          const currentTime = new Date(current.updatedAt || current.createdAt || 0);
          return currentTime > latestTime ? current : latest;
        });
        
        console.log('🩺 진료 중인 환자 발견:', {
          name: latestConsultingQueue.patientId?.basicInfo?.name,
          queueNumber: latestConsultingQueue.queueNumber,
          updatedAt: latestConsultingQueue.updatedAt
        });
        
        setCurrentPatient(latestConsultingQueue);
        setStatus('consulting');
      } else {
        console.log('🩺 현재 환자 없음');
        setCurrentPatient(null);
        setStatus('waiting');
      }
    } catch (error) {
      console.error('현재 환자 정보 로드 실패:', error);
      setError('환자 정보를 불러오는데 실패했습니다.');
      if (error.response?.status !== 404) {
        message.error('환자 정보를 불러오는데 실패했습니다.');
      }
      setCurrentPatient(null);
      setStatus('waiting');
    } finally {
      setLoading(false);
    }
  };

  const handleWebSocketMessage = (data) => {
    console.log('📨 DoctorView - WebSocket 메시지 수신:', data);
    switch (data.type) {
      case 'PATIENT_CALLED_TO_DOCTOR': {
        const patientData = data.patient;
        console.log('👨‍⚕️ 접수실에서 호출된 환자 정보:', patientData);
        
        // 환자 정보 검증
        if (!patientData || !patientData.patientId || !patientData.patientId.basicInfo) {
          console.error('❌ 잘못된 환자 데이터:', patientData);
          message.error('환자 정보가 올바르지 않습니다.');
          return;
        }
        
        // 현재 환자와 다른 환자인 경우에만 업데이트
        const currentPatientId = currentPatient?.patientId?._id;
        const newPatientId = patientData.patientId._id;
        
        if (currentPatientId !== newPatientId) {
          console.log('🔄 새로운 환자 호출:', {
            currentPatient: currentPatient?.patientId?.basicInfo?.name,
            newPatient: patientData.patientId.basicInfo.name
          });
          
          setCurrentPatient(patientData);
          setStatus('called');
          message.success(`${patientData.patientId.basicInfo.name}님이 진료실로 호출되었습니다.`);
          setActiveTab('1');
        } else {
          console.log('⚠️ 이미 같은 환자가 호출됨:', patientData.patientId.basicInfo.name);
        }
        break;
      }
      case 'PATIENT_CALLED': {
        const patientData = data.patient;
        console.log('👨‍⚕️ 호출된 환자 정보:', patientData);
        
        // 환자 정보 검증
        if (!patientData || !patientData.id) {
          console.error('❌ 잘못된 환자 호출 데이터:', patientData);
          return;
        }
        
        // 현재 환자와 다른 환자인 경우에만 업데이트
        const currentPatientId = currentPatient?.patientId?._id;
        const newPatientId = patientData.id;
        
        if (currentPatientId !== newPatientId) {
          console.log('🔄 새로운 환자 호출 (PATIENT_CALLED):', {
            currentPatient: currentPatient?.patientId?.basicInfo?.name,
            newPatient: patientData.name
          });
          
          // 환자 정보를 다시 로드하여 최신 데이터 가져오기
          loadCurrentPatient();
        }
        break;
      }
      case 'QUEUE_UPDATE':
        console.log('🔄 큐 업데이트 - 현재 환자 정보 다시 로드');
        loadCurrentPatient();
        break;
      case 'PONG':
      case 'pong':
      case 'CONNECTED':
        console.log('🔗 WebSocket 연결 확인 메시지:', data.type);
        break;
      default:
        console.log('⚠️ DoctorView - 처리되지 않은 WebSocket 메시지:', data);
        break;
    }
  };
  
  useEffect(() => {
    if (visible) {
      loadCurrentPatient();
      wsClient.connect();
      const removeListener = wsClient.addListener(handleWebSocketMessage);
      return () => {
        if (removeListener) removeListener();
      };
    }
  }, [visible]);

  useEffect(() => {
    console.log('🩺 DoctorView - currentPatient state updated:', JSON.stringify(currentPatient, null, 2));

    if (currentPatient && currentPatient.patientId) {
      // 환자 정보 검증
      if (!currentPatient.patientId.basicInfo || !currentPatient.patientId.basicInfo.name) {
        console.error('❌ 잘못된 환자 데이터:', currentPatient);
        message.error('환자 정보가 올바르지 않습니다.');
        setCurrentPatient(null);
        return;
      }

      console.log('🩺 현재 환자 정보:', {
        patientId: currentPatient.patientId._id,
        patientName: currentPatient.patientId.basicInfo.name,
        queueNumber: currentPatient.queueNumber,
        status: currentPatient.status,
        calledAt: currentPatient.calledAt
      });

      const latestRecord = currentPatient.patientId.records?.[0] || {};

      console.log('🩺 DoctorView - 데이터 디버깅:', {
        patientName: currentPatient.patientId?.basicInfo?.name,
        latestRecord,
        patientMedication: currentPatient.patientId.medication,
        queueMedication: currentPatient.medication,
        patientStress: currentPatient.patientId.stress,
        recordStress: latestRecord.stress,
        allRecords: currentPatient.patientId.records,
        fullPatientData: currentPatient.patientId
      });

      // 복용약물 (우선순위: records[0].medications → patient.medication.current → queue.medication → [])
      const medicationFromRecord = latestRecord.medications || latestRecord.medication?.current || [];
      const medicationFromPatient = currentPatient.patientId.medication?.current;
      const medicationFromQueue = currentPatient.medication;
      
      console.log('💊 약물 데이터 소스 분석:', {
        medicationFromRecord,
        medicationFromPatient,
        medicationFromQueue,
        recordKeys: Object.keys(latestRecord),
        recordMedication: latestRecord.medication
      });
      
      let medicationValue = [];
      if (medicationFromRecord && medicationFromRecord.length > 0) {
        medicationValue = medicationFromRecord;
        console.log('💊 약물 데이터 (records):', medicationFromRecord);
      } else if (medicationFromPatient && medicationFromPatient.length > 0) {
        medicationValue = medicationFromPatient;
        console.log('💊 약물 데이터 (patient):', medicationFromPatient);
      } else if (medicationFromQueue && medicationFromQueue.length > 0) {
        medicationValue = medicationFromQueue;
        console.log('💊 약물 데이터 (queue):', medicationFromQueue);
      }
      
      // 약물 정보가 없으면 "없음"으로 표시
      const medicationText = medicationValue.length > 0 ? medicationValue.join(', ') : '없음';
      setMedication(medicationText);

      // 증상 (우선순위: records[0].symptoms → patient.symptoms → queue.symptoms → [])
      const symptomsFromRecord = latestRecord.symptoms;
      const symptomsFromPatient = currentPatient.patientId.symptoms;
      const symptomsFromQueue = currentPatient.symptoms;
      
      let symptoms = [];
      if (symptomsFromRecord && symptomsFromRecord.length > 0) {
        symptoms = symptomsFromRecord;
      } else if (symptomsFromPatient && symptomsFromPatient.length > 0) {
        symptoms = symptomsFromPatient;
      } else if (symptomsFromQueue && symptomsFromQueue.length > 0) {
        symptoms = symptomsFromQueue;
      }
      
      setSymptoms(symptoms);

      // 스트레스 (우선순위: records[0].stress → patient.stress → '')
      const stressFromRecord = latestRecord.stress;
      const stressFromPatient = currentPatient.patientId.stress;
      
      let stressText = '';
      if (stressFromRecord) {
        if (typeof stressFromRecord === 'object') {
          stressText = `${stressFromRecord.level} (${stressFromRecord.score}점)`;
        } else {
          stressText = stressFromRecord;
        }
      } else if (stressFromPatient) {
        if (typeof stressFromPatient === 'object') {
          stressText = `${stressFromPatient.level} (${stressFromPatient.score}점)`;
        } else {
          stressText = stressFromPatient;
        }
      }
      
      setStress(stressText);

      console.log('🩺 DoctorView - 데이터 로딩 완료:', {
        patientName: currentPatient.patientId?.basicInfo?.name,
        symptoms,
        medicationValue,
        medicationText,
        stressText,
        stressData: latestRecord.stress || currentPatient.patientId.stress
      });

      // 메모 (우선순위: records[0] → patient.memo → '')
      const memo = latestRecord.memo || currentPatient.patientId.memo || '';
      setMemo(memo);
      setPulseAnalysis(currentPatient.pulseAnalysis || '');

      let lastRecord = null;
      const patientRecords = currentPatient.patientId?.records;

      if (Array.isArray(patientRecords) && patientRecords.length > 0) {
        lastRecord = patientRecords[patientRecords.length - 1];
      } else if (typeof patientRecords === 'object' && patientRecords !== null && !Array.isArray(patientRecords)) {
        lastRecord = patientRecords;
      }
      
      const savedPulse = currentPatient.patientId.latestPulseWave || lastRecord?.pulseWave || {};
      
      console.log('🩺 맥파 데이터 로드:', {
        patientName: currentPatient.patientId?.basicInfo?.name,
        latestPulseWave: currentPatient.patientId.latestPulseWave,
        lastRecordPulseWave: lastRecord?.pulseWave,
        finalPulseData: savedPulse
      });

      // 맥파 데이터 설정
      setPulseData({
        systolicBP: savedPulse.systolicBP || '',
        diastolicBP: savedPulse.diastolicBP || '',
        heartRate: savedPulse.heartRate || '',
        pulsePressure: savedPulse.pulsePressure || '',
        'a-b': savedPulse['a-b'] || '',
        'a-c': savedPulse['a-c'] || '',
        'a-d': savedPulse['a-d'] || '',
        'a-e': savedPulse['a-e'] || '',
        'b/a': savedPulse['b/a'] || '',
        'c/a': savedPulse['c/a'] || '',
        'd/a': savedPulse['d/a'] || '',
        'e/a': savedPulse['e/a'] || '',
        elasticityScore: savedPulse.elasticityScore || '',
        PVC: savedPulse.PVC || '',
        BV: savedPulse.BV || '',
        SV: savedPulse.SV || '',
        HR: savedPulse.HR || savedPulse.heartRate || ''
      });
    }
  }, [currentPatient]);

  const handleStartConsultation = async () => {
    if (!currentPatient) return message.warning('진료할 환자가 없습니다.');
    setLoading(true);
    try {
      await queueApi.updateQueueStatus(currentPatient._id, 'consulting');
      setStatus('consulting');
      setCurrentPatient(prev => prev ? { ...prev, status: 'consulting' } : prev);
      message.success('진료를 시작합니다.');
      wsClient.send({ type: 'CONSULTATION_STARTED', patientId: currentPatient._id });
    } catch (error) {
      console.error('진료 시작 실패:', error);
      message.error('진료 시작에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteConsultation = async () => {
    if (!currentPatient) return message.warning('진료 완료할 환자가 없습니다.');
    
    setLoading(true);
    try {
      await queueApi.saveNote(currentPatient._id, { symptoms, memo, stress, pulseAnalysis });
      await queueApi.updateQueueStatus(currentPatient._id, 'done');
      
      setStatus('waiting');
      setCurrentPatient(null);
      message.success('진료를 완료했습니다.');
      wsClient.send({ type: 'CONSULTATION_COMPLETED' });
    } catch (error) {
      console.error('진료 완료 실패:', error);
      message.error('진료 완료 처리에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePulseData = () => {
    const pulseDataString = Object.entries(pulseData).filter(([_, v]) => v).map(([k, v]) => `${k}: ${v}`).join(', ');
    setPulseAnalysis(pulseDataString);
    message.success('맥파 분석 데이터가 임시 저장되었습니다.');
  };

  const handleSaveNote = async () => {
    if (!currentPatient) return;
    try {
      await queueApi.saveNote(currentPatient._id, {
        symptoms,
        memo,
        stress,
        pulseAnalysis
      });
      message.success('진단 내용이 임시 저장되었습니다.');
    } catch (error) {
      console.error('진단 저장 실패:', error);
      message.error('진단 내용 저장에 실패했습니다.');
    }
  };

  const handleShowHistoryComparison = () => {
    setShowHistoryComparison(true);
  };

  const handleCloseHistoryComparison = () => {
    setShowHistoryComparison(false);
  };

  const renderPulseAnalysis = () => {
    const handleInputChange = (key, value) => {
      setPulseData(prev => {
        const newPulseData = { ...prev, [key]: value };
        if (key === 'systolicBP' || key === 'diastolicBP') {
          const sbp = Number(newPulseData.systolicBP);
          const dbp = Number(newPulseData.diastolicBP);
          if (!isNaN(sbp) && !isNaN(dbp)) {
            newPulseData.pulsePressure = sbp - dbp;
          }
        }
        if (key === 'heartRate') {
          newPulseData.HR = value;
        }
        return newPulseData;
      });
    };

    return (
      <PulseAnalysisCard title="맥파 분석 데이터">
        <Form layout="vertical">
          <Row gutter={16}>
            <Col span={6}><Form.Item label="수축기 혈압"><Input value={pulseData.systolicBP} onChange={e => handleInputChange('systolicBP', e.target.value)} /></Form.Item></Col>
            <Col span={6}><Form.Item label="이완기 혈압"><Input value={pulseData.diastolicBP} onChange={e => handleInputChange('diastolicBP', e.target.value)} /></Form.Item></Col>
            <Col span={6}><Form.Item label="심박수"><Input value={pulseData.heartRate} onChange={e => handleInputChange('heartRate', e.target.value)} /></Form.Item></Col>
            <Col span={6}><Form.Item label="맥압"><Input value={pulseData.pulsePressure} disabled /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={6}><Form.Item label="탄성도 점수"><Input value={pulseData.elasticityScore} disabled /></Form.Item></Col>
            <Col span={6}><Form.Item label="PVC"><Input value={pulseData.PVC} disabled /></Form.Item></Col>
            <Col span={6}><Form.Item label="BV"><Input value={pulseData.BV} disabled /></Form.Item></Col>
            <Col span={6}><Form.Item label="SV"><Input value={pulseData.SV} disabled /></Form.Item></Col>
            <Col span={6}><Form.Item label="HR"><Input value={pulseData.HR} disabled /></Form.Item></Col>
          </Row>
          <Divider>변곡점 데이터</Divider>
          <Row gutter={16}>
            <Col span={6}><Form.Item label="a-b"><Input value={pulseData['a-b']} onChange={e => handleInputChange('a-b', e.target.value)} /></Form.Item></Col>
            <Col span={6}><Form.Item label="a-c"><Input value={pulseData['a-c']} onChange={e => handleInputChange('a-c', e.target.value)} /></Form.Item></Col>
            <Col span={6}><Form.Item label="a-d"><Input value={pulseData['a-d']} onChange={e => handleInputChange('a-d', e.target.value)} /></Form.Item></Col>
            <Col span={6}><Form.Item label="a-e"><Input value={pulseData['a-e']} onChange={e => handleInputChange('a-e', e.target.value)} /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={6}><Form.Item label="b/a"><Input value={pulseData['b/a']} onChange={e => handleInputChange('b/a', e.target.value)} /></Form.Item></Col>
            <Col span={6}><Form.Item label="c/a"><Input value={pulseData['c/a']} onChange={e => handleInputChange('c/a', e.target.value)} /></Form.Item></Col>
            <Col span={6}><Form.Item label="d/a"><Input value={pulseData['d/a']} onChange={e => handleInputChange('d/a', e.target.value)} /></Form.Item></Col>
            <Col span={6}><Form.Item label="e/a"><Input value={pulseData['e/a']} onChange={e => handleInputChange('e/a', e.target.value)} /></Form.Item></Col>
          </Row>
          <Button type="primary" onClick={handleSavePulseData} icon={<SaveOutlined />}>
            맥파 데이터 저장
          </Button>
        </Form>
      </PulseAnalysisCard>
    );
  };

  const renderContent = () => (
    <div style={{ padding: '24px' }}>
      {error && (
        <Alert
          message="오류"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: '16px' }}
        />
      )}
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px' }}>환자 정보를 불러오는 중...</div>
        </div>
      ) : currentPatient ? (
        <>
          {/* 환자 정보 헤더 */}
          <Card style={{ marginBottom: '16px', background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)', color: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, color: 'white' }}>
                  {currentPatient.patientId?.basicInfo?.name || '환자'}님
                  <Tag color={status === 'called' ? 'blue' : status === 'consulting' ? 'green' : 'orange'} style={{ marginLeft: '8px' }}>
                    {status === 'called' ? '호출됨' : status === 'consulting' ? '진료중' : '대기중'}
                  </Tag>
                </h2>
                <p style={{ margin: '4px 0 0 0', color: 'rgba(255,255,255,0.8)' }}>
                  대기번호: {currentPatient.queueNumber} | 
                  호출시간: {currentPatient.calledAt ? new Date(currentPatient.calledAt).toLocaleTimeString('ko-KR') : '-'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <HistoryButton
                  icon={<HistoryOutlined />}
                  onClick={handleShowHistoryComparison}
                >
                  진료기록 비교
                </HistoryButton>
                {status === 'called' && (
                  <Button
                    type="primary"
                    size="large"
                    onClick={handleStartConsultation}
                    style={{ background: '#52c41a', borderColor: '#52c41a' }}
                  >
                    진료 시작
                  </Button>
                )}
                {status === 'consulting' && (
                  <Button
                    type="primary"
                    size="large"
                    onClick={handleCompleteConsultation}
                    style={{ background: '#fa8c16', borderColor: '#fa8c16' }}
                  >
                    진료 완료
                  </Button>
                )}
              </div>
            </div>
          </Card>

          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            <TabPane tab="기본정보" key="1">
              <StyledCard title="환자 기본정보">
                <Descriptions bordered column={2}>
                  {getBasicInfoData(currentPatient).map((item, index) => (
                    <Descriptions.Item key={index} label={item.label}>
                      {item.value}
                    </Descriptions.Item>
                  ))}
                </Descriptions>
              </StyledCard>
            </TabPane>

            <TabPane tab="증상/메모" key="2">
              <StyledCard title="증상 및 메모">
                <Form layout="vertical">
                  <Form.Item label="증상">
                    <Select
                      mode="multiple"
                      placeholder="증상을 선택하세요"
                      value={symptoms}
                      onChange={setSymptoms}
                      options={symptomOptions}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                  <Form.Item label="메모">
                    <TextArea
                      rows={4}
                      placeholder="진료 메모를 입력하세요"
                      value={memo}
                      onChange={(e) => setMemo(e.target.value)}
                    />
                  </Form.Item>
                  <Form.Item label="스트레스">
                    <Input
                      placeholder="스트레스 정보"
                      value={stress}
                      onChange={(e) => setStress(e.target.value)}
                    />
                  </Form.Item>
                  <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveNote}>
                    저장
                  </Button>
                </Form>
              </StyledCard>
            </TabPane>

            <TabPane tab="맥파분석" key="3">
              <PulseAnalysisCard title="맥파 분석">
                {renderPulseAnalysis()}
              </PulseAnalysisCard>
            </TabPane>

            <TabPane tab="81맥상" key="4">
              <MacSangCard title="81맥상 분석">
                <PulseVisualization pulseData={pulseData} />
                <Form layout="vertical" style={{ marginTop: '16px' }}>
                  <Form.Item label="맥상 분석 결과">
                    <TextArea
                      rows={6}
                      placeholder="81맥상 분석 결과를 입력하세요"
                      value={pulseAnalysis}
                      onChange={(e) => setPulseAnalysis(e.target.value)}
                    />
                  </Form.Item>
                  <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveNote}>
                    저장
                  </Button>
                </Form>
              </MacSangCard>
            </TabPane>
          </Tabs>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <UserOutlined style={{ fontSize: '64px', color: '#d9d9d9' }} />
          <div style={{ marginTop: '16px', fontSize: '16px', color: '#8c8c8c' }}>
            현재 진료할 환자가 없습니다.
          </div>
          <div style={{ marginTop: '8px', color: '#bfbfbf' }}>
            접수실에서 환자를 호출해주세요.
          </div>
        </div>
      )}

      {/* 진료 기록 비교 모달 */}
      <MedicalHistoryComparison
        visible={showHistoryComparison}
        patientId={currentPatient?.patientId?._id}
        patientName={currentPatient?.patientId?.basicInfo?.name}
        onClose={handleCloseHistoryComparison}
      />
    </div>
  );

  if (!visible) return null;

  return (
    <Modal
      title={
        currentPatient
          ? `진료실 - ${currentPatient.patientId.basicInfo.name} (Q${String(currentPatient.queueNumber).padStart(3, '0')})`
          : '진료실'
      }
      visible={visible}
      onCancel={onClose}
      footer={null}
      width={1200}
      centered
    >
      {renderContent()}
    </Modal>
  );
};

export default DoctorView;