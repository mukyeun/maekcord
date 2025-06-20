import React, { useState, useEffect } from 'react';
import { Modal, Tabs, Card, Tag, Space, Button, Input, message, Spin, Form, Select, Alert, Descriptions, Row, Col, Divider, Switch } from 'antd';
import { FileTextOutlined, SaveOutlined, UserOutlined, HeartOutlined, MedicineBoxOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import * as queueApi from '../../api/queueApi';
import { wsClient } from '../../utils/websocket';
import { 증상카테고리 } from '../../data/symptoms';

const { TabPane } = Tabs;
const { TextArea } = Input;

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
  
  const [pulseData, setPulseData] = useState({
    systolicBP: '', diastolicBP: '', heartRate: '', pulsePressure: '',
    'a-b': '', 'a-c': '', 'a-d': '', 'a-e': '', 'b/a': '', 'c/a': '', 'd/a': '', 'e/a': '',
    elasticityScore: '', PVC: '', BV: '', SV: ''
  });
  
  const [macSangData, setMacSangData] = useState({
    floating: false, sunken: false, slow: false, rapid: false, slippery: false, 
    rough: false, string: false, scattered: false, notes: ''
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
      
      const calledQueue = queueList.find(q => q.status === 'called');
      if (calledQueue) {
        setCurrentPatient(calledQueue);
        setStatus('called');
        return;
      }
      
      const consultingList = queueList.filter(q => q.status === 'consulting');
      const consultingQueue = consultingList.find(q => q._id === currentPatient?._id) || consultingList[0];
      if (consultingQueue) {
        setCurrentPatient(consultingQueue);
        setStatus('consulting');
      } else {
        if (!currentPatient) {
          setCurrentPatient(null);
          setStatus('waiting');
        }
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
        break;
      }
      case 'QUEUE_UPDATE':
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
      const queueSymptoms = currentPatient.symptoms || [];
      const patientSymptoms = currentPatient.patientId?.symptoms || [];
      setSymptoms(queueSymptoms.length > 0 ? queueSymptoms : patientSymptoms);
      setMemo(currentPatient.memo || '');
      setStress(currentPatient.stress || '');
      setPulseAnalysis(currentPatient.pulseAnalysis || '');

      let lastRecord = null;
      const patientRecords = currentPatient.patientId?.records;

      // `records`가 배열인 경우와 객체인 경우 모두 처리
      if (Array.isArray(patientRecords) && patientRecords.length > 0) {
        lastRecord = patientRecords[patientRecords.length - 1];
      } else if (typeof patientRecords === 'object' && patientRecords !== null && !Array.isArray(patientRecords)) {
        lastRecord = patientRecords;
      }
      
      // 백엔드에서 보내준 최신 맥파(latestPulseWave)를 우선 사용
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
      });

      const savedMacSang = lastRecord?.macSang || {};
      setMacSangData({
        floating: savedMacSang.floating || false,
        sunken: savedMacSang.sunken || false,
        slow: savedMacSang.slow || false,
        rapid: savedMacSang.rapid || false,
        slippery: savedMacSang.slippery || false,
        rough: savedMacSang.rough || false,
        string: savedMacSang.string || false,
        scattered: savedMacSang.scattered || false,
        notes: savedMacSang.notes || ''
      });
    } else {
      setSymptoms([]);
      setMemo('');
      setStress('');
      setPulseAnalysis('');
      setPulseData({
        systolicBP: '', diastolicBP: '', heartRate: '', pulsePressure: '',
        'a-b': '', 'a-c': '', 'a-d': '', 'a-e': '', 'b/a': '', 'c/a': '', 'd/a': '', 'e/a': '',
        elasticityScore: '', PVC: '', BV: '', SV: ''
      });
      setMacSangData({
        floating: false, sunken: false, slow: false, rapid: false, slippery: false,
        rough: false, string: false, scattered: false, notes: ''
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
    if (!currentPatient) return message.warning('완료할 진료가 없습니다.');
    setLoading(true);
    try {
      await queueApi.updateQueueStatus(currentPatient._id, 'done', symptoms, memo, stress, pulseAnalysis);
      message.success('진료가 완료되었습니다.');
      wsClient.send({ type: 'CONSULTATION_COMPLETED', patientId: currentPatient._id });
      await queueApi.callNextPatient();
      message.info('다음 환자를 호출했습니다.');
      setCurrentPatient(null);
      setStatus('waiting');
    } catch (error) {
      console.error('진료 완료 실패:', error);
      message.error('진료 완료에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePulseData = () => {
    const pulseDataString = Object.entries(pulseData).filter(([_, v]) => v).map(([k, v]) => `${k}: ${v}`).join(', ');
    setPulseAnalysis(pulseDataString);
    message.success('맥파 분석 데이터가 임시 저장되었습니다.');
  };
  const handleSaveMacSangData = () => {
    const selected = Object.entries(macSangData).filter(([k, v]) => v && k !== 'notes').map(([k]) => k).join(', ');
    const note = macSangData.notes ? `, 비고: ${macSangData.notes}` : '';
    const macSangString = selected ? `81맥상: ${selected}${note}` : macSangData.notes;
    setPulseAnalysis(prev => prev ? `${prev}; ${macSangString}` : macSangString);
    message.success('81맥상 데이터가 임시 저장되었습니다.');
  };

  const handleSaveNote = async () => {
    if (!currentPatient) return message.warning('저장할 환자 정보가 없습니다.');
    try {
      await queueApi.updateQueueStatus(currentPatient._id, status, symptoms, memo, stress, pulseAnalysis);
      message.success('진단 메모가 저장되었습니다.');
    } catch (error) {
      console.error('진단 메모 저장 실패:', error);
      message.error('진단 메모 저장에 실패했습니다.');
    }
  };

  const renderPulseAnalysis = () => {
    const handleInputChange = (key, value) => {
      setPulseData(prev => ({ ...prev, [key]: value }));
    };

    return (
      <PulseAnalysisCard title="맥파 데이터 입력" icon={<HeartOutlined />}>
        <Row gutter={16}>
            <Col span={6}><Form.Item label="수축기 혈압"><Input value={pulseData.systolicBP} onChange={e => handleInputChange('systolicBP', e.target.value)} /></Form.Item></Col>
            <Col span={6}><Form.Item label="이완기 혈압"><Input value={pulseData.diastolicBP} onChange={e => handleInputChange('diastolicBP', e.target.value)} /></Form.Item></Col>
            <Col span={6}><Form.Item label="심박수"><Input value={pulseData.heartRate} onChange={e => handleInputChange('heartRate', e.target.value)} /></Form.Item></Col>
            <Col span={6}><Form.Item label="맥압"><Input value={pulseData.pulsePressure} onChange={e => handleInputChange('pulsePressure', e.target.value)} /></Form.Item></Col>
        </Row>
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
        <Row gutter={16}>
            <Col span={6}><Form.Item label="혈관 탄성도"><Input value={pulseData.elasticityScore} onChange={e => handleInputChange('elasticityScore', e.target.value)} /></Form.Item></Col>
            <Col span={6}><Form.Item label="PVC"><Input value={pulseData.PVC} onChange={e => handleInputChange('PVC', e.target.value)} /></Form.Item></Col>
            <Col span={6}><Form.Item label="BV"><Input value={pulseData.BV} onChange={e => handleInputChange('BV', e.target.value)} /></Form.Item></Col>
            <Col span={6}><Form.Item label="SV"><Input value={pulseData.SV} onChange={e => handleInputChange('SV', e.target.value)} /></Form.Item></Col>
        </Row>
        <Button type="primary" onClick={handleSavePulseData} style={{ marginTop: 16 }}>맥파 데이터 저장</Button>
      </PulseAnalysisCard>
    );
  };

  const renderMacSang = () => (
    <MacSangCard title="81맥상 진단" icon={<MedicineBoxOutlined />}>
      <Row gutter={16}>
        <Col span={6}><Form.Item label="부맥"><Switch checked={macSangData.floating} onChange={c => setMacSangData(p => ({...p, floating: c}))} /></Form.Item></Col>
        <Col span={6}><Form.Item label="침맥"><Switch checked={macSangData.sunken} onChange={c => setMacSangData(p => ({...p, sunken: c}))} /></Form.Item></Col>
        <Col span={6}><Form.Item label="지맥"><Switch checked={macSangData.slow} onChange={c => setMacSangData(p => ({...p, slow: c}))} /></Form.Item></Col>
        <Col span={6}><Form.Item label="촉맥"><Switch checked={macSangData.rapid} onChange={c => setMacSangData(p => ({...p, rapid: c}))} /></Form.Item></Col>
      </Row>
      <Row gutter={16}>
        <Col span={6}><Form.Item label="활맥"><Switch checked={macSangData.slippery} onChange={c => setMacSangData(p => ({...p, slippery: c}))} /></Form.Item></Col>
        <Col span={6}><Form.Item label="삽맥"><Switch checked={macSangData.rough} onChange={c => setMacSangData(p => ({...p, rough: c}))} /></Form.Item></Col>
        <Col span={6}><Form.Item label="현맥"><Switch checked={macSangData.string} onChange={c => setMacSangData(p => ({...p, string: c}))} /></Form.Item></Col>
        <Col span={6}><Form.Item label="산맥"><Switch checked={macSangData.scattered} onChange={c => setMacSangData(p => ({...p, scattered: c}))} /></Form.Item></Col>
      </Row>
      <Form.Item label="비고">
        <TextArea rows={3} value={macSangData.notes} onChange={e => setMacSangData(p => ({ ...p, notes: e.target.value }))} />
      </Form.Item>
      <Button type="primary" onClick={handleSaveMacSangData} style={{ marginTop: 16 }}>81맥상 저장</Button>
    </MacSangCard>
  );

  return (
    <Modal
      title={<Space><UserOutlined />진료실 {currentPatient && <Tag color="blue">{currentPatient.patientId?.basicInfo?.name} ({currentPatient.queueNumber})</Tag>}</Space>}
      open={visible}
      onCancel={onClose}
      width={1400}
      footer={null}
      style={{ top: 20 }}
      styles={{ body: { maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' } }}
    >
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={8}>
            <strong>현재 상태:</strong> 
            <Tag color={status === 'waiting' ? 'orange' : status === 'called' ? 'blue' : 'green'}>
              {status === 'waiting' ? '대기중' : status === 'called' ? '호출됨' : '진료중'}
            </Tag>
          </Col>
          <Col span={16}>
            <Space>
              {status === 'called' && <Button type="primary" onClick={handleStartConsultation} loading={loading}>진료 시작</Button>}
              {status === 'consulting' && <Button type="primary" danger onClick={handleCompleteConsultation} loading={loading}>진료 완료</Button>}
            </Space>
          </Col>
        </Row>
      </Card>

      {!currentPatient || !currentPatient.patientId ? (
        <Alert message="호출된 환자가 없습니다" description="접수실에서 환자를 호출해 주세요." type="info" showIcon style={{ marginBottom: 16 }}/>
      ) : loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}><Spin size="large" /><p>환자 정보를 불러오는 중...</p></div>
      ) : (
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="진료 요약" key="1">
            <StyledCard title="환자 기본 정보">
              <Descriptions column={2} bordered>
                {getBasicInfoData(currentPatient).map((item, index) => <Descriptions.Item key={index} label={item.label}>{item.value}</Descriptions.Item>)}
              </Descriptions>
            </StyledCard>
          </TabPane>
          <TabPane tab="맥파 분석" key="2">{renderPulseAnalysis()}</TabPane>
          <TabPane tab="81맥상" key="3">{renderMacSang()}</TabPane>
          <TabPane tab="진단 메모" key="4">
            <StyledCard title="진단 메모">
              <Form.Item label="증상"><Select mode="multiple" value={symptoms} onChange={setSymptoms} options={symptomOptions} style={{ width: '100%' }} /></Form.Item>
              <Form.Item label="메모"><TextArea rows={4} value={memo} onChange={e => setMemo(e.target.value)} /></Form.Item>
              <Form.Item label="스트레스"><TextArea rows={2} value={stress} onChange={e => setStress(e.target.value)} /></Form.Item>
              <Form.Item label="맥파 분석 결과"><TextArea rows={3} value={pulseAnalysis} onChange={e => setPulseAnalysis(e.target.value)} /></Form.Item>
              <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveNote} style={{ marginTop: 16 }}>진단 메모 저장</Button>
            </StyledCard>
          </TabPane>
        </Tabs>
      )}
      <Divider />
      <div style={{ textAlign: 'right' }}>
        <Button icon={<FileTextOutlined />} onClick={() => message.info('PDF 출력 기능은 준비 중입니다.')} disabled={!currentPatient}>PDF 출력</Button>
      </div>
    </Modal>
  );
};

export default DoctorView;