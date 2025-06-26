import React, { useState, useEffect } from 'react';
import { Modal, Tabs, Card, Tag, Space, Button, Input, message, Spin, Form, Select, Alert, Descriptions, Row, Col, Divider, Switch, Typography } from 'antd';
import { FileTextOutlined, SaveOutlined, UserOutlined, HeartOutlined, MedicineBoxOutlined, BookOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import * as queueApi from '../../api/queueApi';
import * as pulseApi from '../../api/pulseApi';
import { wsClient } from '../../utils/websocket';
import { 증상카테고리 } from '../../data/symptoms';
import PulseVisualization from './PulseVisualization';

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
      const todayQueueListResponse = await queueApi.getTodayQueueList();
      const queueList = todayQueueListResponse.data || [];
      
      console.log('🩺 loadCurrentPatient - 큐 목록:', queueList.map(q => ({
        id: q._id,
        name: q.patientId?.basicInfo?.name,
        status: q.status,
        queueNumber: q.queueNumber
      })));
      
      // 먼저 호출된 환자 확인
      const calledQueue = queueList.find(q => q.status === 'called');
      if (calledQueue) {
        console.log('🩺 호출된 환자 발견:', calledQueue.patientId?.basicInfo?.name);
        setCurrentPatient(calledQueue);
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
        
        console.log('🩺 진료 중인 환자 발견:', latestConsultingQueue.patientId?.basicInfo?.name);
        setCurrentPatient(latestConsultingQueue);
        setStatus('consulting');
      } else {
        console.log('🩺 현재 환자 없음');
        setCurrentPatient(null);
        setStatus('waiting');
      }
    } catch (error) {
      console.error('현재 환자 정보 로드 실패:', error);
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
        setCurrentPatient(patientData);
        setStatus('called');
        message.success(`${patientData.patientId?.basicInfo?.name || '환자'}님이 진료실로 호출되었습니다.`);
        setActiveTab('1');
        break;
      }
      case 'PATIENT_CALLED': {
        const patientData = data.patient;
        console.log('👨‍⚕️ 호출된 환자 정보:', patientData);
        setCurrentPatient(patientData);
        setStatus('called');
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
      const stressData = latestRecord.stress?.records?.stress || latestRecord.stress || currentPatient.patientId.stress || '';
      let stressText = '';
      
      console.log('😰 스트레스 데이터 분석:', {
        stressData,
        type: typeof stressData,
        isObject: typeof stressData === 'object' && stressData !== null,
        recordStress: latestRecord.stress,
        recordStressRecords: latestRecord.stress?.records?.stress,
        patientStress: currentPatient.patientId.stress
      });
      
      if (typeof stressData === 'object' && stressData !== null) {
        const level = stressData.level || 'normal';
        const score = typeof stressData.score === 'number'
          ? stressData.score
          : stressData.totalScore || 0;
        const levelText = {
          'low': '낮음',
          'normal': '보통',
          'high': '높음',
          'very_high': '매우 높음',
          '낮음': '낮음',
          '보통': '보통',
          '중간': '중간',
          '높음': '높음',
          '매우 높음': '매우 높음'
        }[level] || level;
        stressText = `${levelText} (${score}점)`;
      } else if (typeof stressData === 'string' && stressData) {
        const levelText = {
          'low': '낮음',
          'normal': '보통',
          'high': '높음',
          'very_high': '매우 높음',
          '낮음': '낮음',
          '보통': '보통',
          '중간': '중간',
          '높음': '높음',
          '매우 높음': '매우 높음'
        }[stressData] || stressData;
        const score = currentPatient.patientId.stress?.score || currentPatient.patientId.stress?.totalScore || 0;
        stressText = `${levelText} (${score}점)`;
      } else {
        stressText = 'N/A';
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

      console.log('latestRecord', latestRecord);
      console.log('medicationFromRecord', medicationFromRecord);
    } else {
      setSymptoms([]);
      setMemo('');
      setStress('');
      setPulseAnalysis('');
      setPulseData({
        systolicBP: '', diastolicBP: '', heartRate: '', pulsePressure: '',
        'a-b': '', 'a-c': '', 'a-d': '', 'a-e': '', 'b/a': '', 'c/a': '', 'd/a': '', 'e/a': '',
        elasticityScore: '', PVC: '', BV: '', SV: '', HR: ''
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
            <Col span={3}><Form.Item label="a-b"><Input value={pulseData['a-b']} disabled /></Form.Item></Col>
            <Col span={3}><Form.Item label="a-c"><Input value={pulseData['a-c']} disabled /></Form.Item></Col>
            <Col span={3}><Form.Item label="a-d"><Input value={pulseData['a-d']} disabled /></Form.Item></Col>
            <Col span={3}><Form.Item label="a-e"><Input value={pulseData['a-e']} disabled /></Form.Item></Col>
            <Col span={3}><Form.Item label="b/a"><Input value={pulseData['b/a']} disabled /></Form.Item></Col>
            <Col span={3}><Form.Item label="c/a"><Input value={pulseData['c/a']} disabled /></Form.Item></Col>
            <Col span={3}><Form.Item label="d/a"><Input value={pulseData['d/a']} disabled /></Form.Item></Col>
            <Col span={3}><Form.Item label="e/a"><Input value={pulseData['e/a']} disabled /></Form.Item></Col>
          </Row>
        </Form>
      </PulseAnalysisCard>
    );
  };

  const renderMacSang = () => (
    <PulseVisualization pulseData={pulseData} />
  );

  const renderContent = () => (
    <Tabs activeKey={activeTab} onChange={setActiveTab}>
      <TabPane tab="진료 요약" key="1" disabled={!currentPatient}>
        <StyledCard title="환자 기본 정보">
          <Descriptions column={2} bordered>
            {getBasicInfoData(currentPatient).map((item, index) => (
              <Descriptions.Item key={index} label={item.label}>{item.value}</Descriptions.Item>
            ))}
            <Descriptions.Item label="복용약물" span={2}>
              {medication && medication.length > 0 ? medication : '없음'}
            </Descriptions.Item>
            <Descriptions.Item label="주요 증상" span={2}>
              {(symptoms && symptoms.length > 0) ? symptoms.join(', ') : 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="스트레스" span={2}>
              {stress ? stress : 'N/A'}
            </Descriptions.Item>
          </Descriptions>
        </StyledCard>
      </TabPane>
      <TabPane tab="맥파 분석" key="2" disabled={!currentPatient}>
        {renderPulseAnalysis()}
      </TabPane>
      <TabPane tab="81맥상" key="3" disabled={!currentPatient}>
        <PulseVisualization pulseData={pulseData} />
      </TabPane>
      <TabPane tab="진단 메모" key="4" disabled={!currentPatient}>
        <StyledCard title="진단 메모">
          <Form layout="vertical">
            <Form.Item label="주요 증상">
              <Select
                mode="multiple"
                style={{ width: '100%' }}
                placeholder="환자의 주요 증상을 선택하세요"
                value={symptoms}
                onChange={setSymptoms}
                options={symptomOptions}
              />
            </Form.Item>
            <Form.Item label="스트레스 단계">
              <Input value={stress} onChange={e => setStress(e.target.value)} />
            </Form.Item>
            <Form.Item label="진단 메모">
              <TextArea rows={4} value={memo} onChange={e => setMemo(e.target.value)} />
            </Form.Item>
          </Form>
        </StyledCard>
      </TabPane>
    </Tabs>
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
      footer={
        <Space>
          <Button onClick={onClose}>닫기</Button>
          {status === 'called' && <Button type="primary" onClick={handleStartConsultation}>진료 시작</Button>}
          {status === 'consulting' && <Button onClick={handleSaveNote} icon={<SaveOutlined />}>진단 저장</Button>}
          {status === 'consulting' && <Button type="primary" danger onClick={handleCompleteConsultation}>진료 완료</Button>}
        </Space>
      }
      width={1200}
      centered
    >
      <Spin spinning={loading} tip="로딩 중...">
        {currentPatient ? renderContent() : <Alert message="현재 진료 중인 환자가 없습니다." type="info" showIcon />}
      </Spin>
    </Modal>
  );
};

export default DoctorView;