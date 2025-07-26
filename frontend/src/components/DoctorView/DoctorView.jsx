import React, { useState, useEffect } from 'react';
import { Modal, Tabs, Card, Tag, Space, Button, Input, message, Spin, Form, Select, Alert, Descriptions, Row, Col, Divider, Switch, Typography, DatePicker, Statistic, Badge } from 'antd';
import { FileTextOutlined, SaveOutlined, UserOutlined, HeartOutlined, MedicineBoxOutlined, BookOutlined, HistoryOutlined, DashboardOutlined, CalendarOutlined, CloseOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import * as queueApi from '../../api/queueApi';
import * as pulseApi from '../../api/pulseApi';
import * as patientApi from '../../api/patientApi';
import { wsClient } from '../../utils/websocket';
import { 증상카테고리 } from '../../data/symptoms';
import PulseVisualization from './PulseVisualization';
import MedicalHistoryComparison from './MedicalHistoryComparison';
import PatientSummary from './PatientSummary';
import api from '../../api/axios';
import moment from 'moment';
import UnifiedModal from '../Common/UnifiedModal';

const { TabPane } = Tabs;
const { TextArea } = Input;
const { Text } = Typography;

const StyledCard = styled(Card)`
  margin-bottom: 16px;
  border-radius: 16px;
  box-shadow: 0 2 16 rgba(25 1180, 08 border: 1px solid rgba(25, 1182101 
  .ant-card-head[object Object]background: linear-gradient(135deg, #f8fc 0%, #e2e8f0100
    border-bottom: 1px solid rgba(25, 118, 0.1);
    border-radius: 16x 00
    padding: 16x 24  }
  
  .ant-card-head-title [object Object]
    font-weight: 700
    font-size: 18px;
    color: #100000  }
  
  .ant-card-body[object Object]
    padding: 24px;
    background: white;
    border-radius: 0066 }
`;

const PulseAnalysisCard = styled(Card)`
  margin-bottom: 16px;
  border-radius: 16px;
  box-shadow: 0 2 16 rgba(25 1180, 08 border: 1px solid rgba(25, 1182101 
  .ant-card-head[object Object]background: linear-gradient(135deg, #f0ff 0%, #e6f3ff100
    border-bottom: 1px solid rgba(25, 118, 0.1);
    border-radius: 16x 00
    padding: 16x 24  }
  
  .ant-card-head-title [object Object]
    font-weight: 700
    font-size: 18px;
    color: #100000  }
  
  .ant-card-body[object Object]
    padding: 24px;
    background: white;
    border-radius: 0066
  }
`;

const MacSangCard = styled(Card)`
  margin-bottom: 16px;
  border-radius: 16px;
  box-shadow: 0 2px 16px rgba(25, 118, 210, 0.08);
  border: 1px solid rgba(25, 118, 210, 0.1);
  
  .ant-card-head {
    background: linear-gradient(135deg, #fff0f6 0%, #ffe6f0 100%);
    border-bottom: 1px solid rgba(25, 118, 210, 0.1);
    border-radius: 16px 16px 0 0;
    padding: 16px 24px;
  }
  
  .ant-card-head-title {
    font-weight: 700;
    font-size: 18px;
    color: #100000;
  }
  
  .ant-card-body {
    padding: 24px;
    background: white;
    border-radius: 0 0 16px 16px;
    max-height: calc(100vh - 300px);
    overflow-y: auto;
    
    /* 스크롤바 스타일링 */
    &::-webkit-scrollbar {
      width: 6px;
    }
    
    &::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.05);
      border-radius: 3px;
    }
    
    &::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.2);
      border-radius: 3px;
      
      &:hover {
        background: rgba(0, 0, 0, 0.3);
      }
    }
  }

  /* 반응형 디자인 */
  @media (max-width: 768px) {
    margin-bottom: 12px;
    border-radius: 12px;
    
    .ant-card-head {
      padding: 12px 16px;
      border-radius: 12px 12px 0 0;
      
      .ant-card-head-title {
        font-size: 16px;
      }
    }
    
    .ant-card-body {
      padding: 16px;
      max-height: calc(100vh - 200px);
      border-radius: 0 0 12px 12px;
    }
  }

  @media (max-width: 480px) {
    .ant-card-head {
      padding: 10px 12px;
      
      .ant-card-head-title {
        font-size: 14px;
      }
    }
    
    .ant-card-body {
      padding: 12px;
    }
  }
`;

const HistoryButton = styled(Button)`
  margin-left: 8background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
  border: none;
  color: white;
  border-radius: 8px;
  font-weight:60;
  height: 40x;
  padding: 0 20x;
  
  &:hover[object Object]background: linear-gradient(135deg, #1e3a8a 0%, #1e1b4b100;
    color: white;
    transform: translateY(-1px);
    box-shadow: 0 4x 12x rgba(30, 64750.3
`;

const HistoryControls = styled.div`
  margin-bottom: 1rem;
  display: flex;
  gap: 1rem;
  align-items: center;
  background: white;
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 06 border:1px solid #f0f0f0;
`;

const ActionButton = styled(Button)`
  background: linear-gradient(135deg, #1081%, #059669%);
  border: none;
  color: white;
  border-radius: 8px;
  font-weight:60;
  height: 40x;
  padding: 0 20x;
  
  &:hover[object Object]background: linear-gradient(135deg, #059669%, #047857100;
    color: white;
    transform: translateY(-1px);
    box-shadow: 0 4 12 rgba(16,185290.3
  }
`;

const TabContainer = styled.div`
  .ant-tabs-tab {
    border-radius: 8px 8px 0 0;
    margin-right: 4px;
    font-weight: 600  }
  
  .ant-tabs-tab-active[object Object]background: linear-gradient(135deg, #1e40af 0%, #1e3a8a100;
    color: white;
  }
  
  .ant-tabs-content-holder[object Object] background: white;
    border-radius: 0 16x;
    padding: 24px;
    box-shadow: 0 2 16 rgba(25 118, 210
`;

const DoctorView = ({ visible, onClose, selectedPatientId = null, isFullPage = false }) => {
  console.log('DoctorView rendered:', { visible, selectedPatientId, isFullPage }); // 디버깅

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
  const [visitHistory, setVisitHistory] = useState([]);
  const [selectedVisitDate, setSelectedVisitDate] = useState(null);
  const [historicalData, setHistoricalData] = useState(null);
  const [isViewingHistoricalRecord, setIsViewingHistoricalRecord] = useState(false);
  const [visitTime, setVisitTime] = useState(''); // 진료 시간 상태 추가
  
  const [pulseData, setPulseData] = useState({
    systolicBP: '', diastolicBP: '', heartRate: '', pulsePressure: '',
    'a-b': '', 'a-c': '', 'a-d': '', 'a-e': '', 'b/a': '', 'c/a': '', 'd/a': '', 'e/a': '',
    elasticityScore: '', PVC: '', BV: '', SV: '', HR: ''
  });
  
  const getBasicInfoData = (patient, historicalRecord = null) => {
    if (!patient?.patientId?.basicInfo) return [];

    const basicInfo = patient.patientId.basicInfo;
    const recordData = historicalRecord || {};
    
    return [
      { label: '이름', value: basicInfo.name || '-' },
      { label: '주민번호', value: basicInfo.residentNumber || '-' },
      { label: '연락처', value: basicInfo.phone || '-' },
      { label: '성별', value: basicInfo.gender === 'male' ? '남성' : basicInfo.gender === 'female' ? '여성' : '-' },
      { label: '신장', value: basicInfo.height ? `${basicInfo.height}cm` : '-' },
      { label: '체중', value: basicInfo.weight ? `${basicInfo.weight}kg` : '-' },
      { label: 'BMI', value: basicInfo.bmi || '-' },
      { label: '성격', value: basicInfo.personality || '-' },
      { label: '노동강도', value: basicInfo.workIntensity || '-' }
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
      setSelectedVisitDate(null); // 과거 기록 조회 상태 리셋
      const todayQueueListResponse = await queueApi.getTodayQueueList();
      const queueList = todayQueueListResponse.data || [];
      
      console.log('🩺 loadCurrentPatient - 큐 목록:', queueList.map(q => ({
        id: q._id,
        name: q.patientId?.basicInfo?.name,
        status: q.status,
        queueNumber: q.queueNumber,
        calledAt: q.calledAt,
        updatedAt: q.updatedAt,
        createdAt: q.createdAt
      })));
      
      // 먼저 호출된 환자 확인 (가장 최근에 호출된 환자)
      const calledQueues = queueList.filter(q => q.status === 'called');
      if (calledQueues.length > 0) {
        // 가장 최근에 호출된 환자를 선택 (updatedAt 기준)
        const latestCalledQueue = calledQueues.reduce((latest, current) => {
          const latestTime = new Date(latest.updatedAt || latest.calledAt || 0);
          const currentTime = new Date(current.updatedAt || current.calledAt || 0);
          return currentTime > latestTime ? current : latest;
        });
        
        console.log('🩺 호출된 환자 발견:', {
          name: latestCalledQueue.patientId?.basicInfo?.name,
          queueNumber: latestCalledQueue.queueNumber,
          calledAt: latestCalledQueue.calledAt,
          updatedAt: latestCalledQueue.updatedAt
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
          updatedAt: latestConsultingQueue.updatedAt,
          createdAt: latestConsultingQueue.createdAt
        });
        
        setCurrentPatient(latestConsultingQueue);
        setStatus('consulting');

        // 최신 맥파 데이터 설정
        if (latestConsultingQueue.patientId?.latestPulseWave) {
          setPulseData(latestConsultingQueue.patientId.latestPulseWave);
          console.log('최신 맥파 데이터 설정:', latestConsultingQueue.patientId.latestPulseWave);
        }
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

  const loadSelectedPatient = async (patientId) => {
    console.log('🔍 loadSelectedPatient called:', patientId); // 디버깅
    if (!patientId) return;
    
    try {
      setLoading(true);
      setError(null);
      setSelectedVisitDate(null); // 과거 기록 조회 상태 리셋
      
      console.log('🔍 환자 정보 조회 시작...'); // 디버깅
      
      //1 정보 조회
      const patientResponse = await patientApi.getPatientById(patientId);
      console.log('🔍 Patient data response:', patientResponse); // 디버깅

      if (!patientResponse.success) {
        console.error('❌ 환자 정보 조회 실패:', patientResponse); // 디버깅
        throw new Error('환자 정보를 불러올 수 없습니다.');
      }
      
      // API 응답 구조에 따라 데이터 추출
      const patientData = patientResponse.data?.patientData || patientResponse.data?.data || patientResponse.data;
      console.log('🔍 환자 데이터:', patientData); // 디버깅
      
      if (!patientData) {
        throw new Error('환자 데이터를 찾을 수 없습니다.');
      }
      
      // 2. 해당 환자의 대기열 정보 조회 또는 생성
      let queueData;
      const queueResponse = await queueApi.getTodayQueueList();
      console.log('🔍 Queue data response:', queueResponse); // 디버깅
      
      const existingQueue = queueResponse.data?.find(q => 
        q.patientId?._id === patientId
      );
      
      if (existingQueue) {
        queueData = existingQueue;
        console.log('🔍 기존 대기열 발견:', queueData); // 디버깅
      } else {
        console.log('🔍 새 대기열 생성...'); // 디버깅
        // 대기열에 없으면 새로 등록
        const createQueueResponse = await queueApi.registerQueue({
          patientId: patientId,
          date: new Date().toISOString().split('T')[0]
        });
        queueData = createQueueResponse.data;
        console.log('🔍 새 대기열 생성됨:', queueData); // 디버깅
      }
      
      // 환자 정보와 대기열 정보 결합
      const combinedData = {
        ...queueData,
        patientId: patientData
      };
      
      console.log('🔍 Setting current patient:', combinedData); // 디버깅
      setCurrentPatient(combinedData);
      setStatus('consulting');
      
    } catch (error) {
      console.error('❌선택된 환자 정보 로드 실패:', error);
      setError('환자 정보를 불러오는데 실패했습니다.');
      message.error('환자 정보를 불러오는데 실패했습니다.');
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
    console.log('DoctorView useEffect:', { visible, selectedPatientId }); // 디버깅
    if (visible && selectedPatientId) {
      loadSelectedPatient(selectedPatientId);
    } else if (visible) {
      loadCurrentPatient();
    }
    
    // 모달이 열릴 때 selectedVisitDate 초기화
    if (visible) {
      setSelectedVisitDate(null);
      setHistoricalData(null);
    }
  }, [visible, selectedPatientId]);

  // WebSocket 연결 관리
  useEffect(() => {
    if (visible) {
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
    try {
      if (!currentPatient?._id) return;
      
      // 현재 시간을 사용하여 정확한 시간 저장
      const now = moment();
      const visitDateTime = now.format('YYYY-MM-DD HH:mm:ss');

      console.log('📝 진료 노트 저장 시도:', {
        currentTime: visitDateTime,
        symptoms: symptoms.length > 0 ? symptoms : '없음',
        hasMemo: !!memo,
        hasStress: !!stress,
        hasPulseAnalysis: !!pulseAnalysis
      });
      
      const saveData = {
        symptoms,
        memo,
        stress,
        pulseAnalysis,
        visitDateTime: visitDateTime,
        date: now.format('YYYY-MM-DD'),
        createdAt: visitDateTime
      };

      console.log('저장할 데이터:', saveData);
      
      const response = await queueApi.saveQueueNote(currentPatient._id, saveData);

      if (response.data.success) {
        // 저장 성공 후 visitTime 업데이트
        const formattedTime = now.format('YYYY년 MM월 DD일 HH:mm');
        setVisitTime(formattedTime);
        
        console.log('✅ 진료 기록 저장 성공:', {
          savedTime: visitDateTime,
          formattedTime: formattedTime,
          serverResponse: response.data
        });

        message.success('진료 기록이 저장되었습니다.');
        await loadCurrentPatient();
        
        // 진료 기록 목록 새로고침
        if (currentPatient?.patientId?._id) {
          await loadVisitHistory(currentPatient.patientId._id);
        }
      } else {
        console.error('❌ 진료 기록 저장 실패:', response.data);
        message.error('진료 기록 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('❌ 진료 기록 저장 중 오류:', error);
      message.error('진료 기록 저장 중 오류가 발생했습니다.');
    }
  };

  // 진료 시간 입력 필드 업데이트 함수 수정
  const updateVisitTimeInput = (newTime) => {
    const timeInput = document.querySelector('.visit-time-input');
    if (timeInput && newTime) {
      const momentTime = moment(newTime);
      const formattedTime = `${momentTime.format('YYYY')}년 ${momentTime.format('MM')}월 ${momentTime.format('DD')}일 ${momentTime.format('HH')}시 ${momentTime.format('mm')}분`;
      timeInput.value = formattedTime;
      console.log('🕒 진료 시간 입력 필드 업데이트:', {
        newTime,
        formatted: formattedTime,
        momentFormat: momentTime.format('YYYY-MM-DD HH:mm:ss')
      });
    }
  };

  // 환자가 변경될 때마다 진료 기록 목록 로드
  useEffect(() => {
    if (currentPatient?.patientId?._id) {
      console.log('환자 선택됨, 진료 기록 목록 로드:', {
        patientId: currentPatient.patientId._id,
        patientName: currentPatient.patientId?.basicInfo?.name
      });
      loadVisitHistory(currentPatient.patientId._id);
      setSelectedVisitDate(null); // 환자가 변경될 때 선택된 날짜 초기화
      setHistoricalData(null); // 이전 기록 데이터 초기화
    }
  }, [currentPatient?.patientId?._id]);

  // 진료 기록 목록 불러오기
  const loadVisitHistory = async (patientId) => {
    try {
      console.log('진료 기록 목록 조회 시도:', patientId);
      const records = currentPatient.patientId.records || [];
      console.log('진료 기록 목록 응답:', {
        totalRecords: records.length,
        firstRecord: records[0],
        lastRecord: records[records.length - 1]
      });
      
      // API 응답 구조 상세 로깅
      console.log('API 응답 구조:', {
        success: true, // 데이터가 이미 현재 환자 정보에 포함되어 있으므로 항상 true
        hasData: !!records,
        dataStructure: records ? Object.keys(records) : [],
        records: records
      });
      
      let recordsToDisplay = [];
      
      // records 배열이 직접 응답에 있는 경우
      if (records && Array.isArray(records)) {
        recordsToDisplay = records;
      }
      
      if (recordsToDisplay.length > 0) {
        console.log('진료 기록 발견:', {
          recordCount: recordsToDisplay.length,
          firstRecord: recordsToDisplay[0],
          lastRecord: recordsToDisplay[recordsToDisplay.length - 1]
        });
        
        // 날짜순으로 정렬 (최신순)
        recordsToDisplay.sort((a, b) => {
          const dateA = moment(a.visitDateTime || a.date || a.createdAt);
          const dateB = moment(b.visitDateTime || b.date || b.createdAt);
          return dateB.valueOf() - dateA.valueOf();
        });
        
        // 각 기록의 시간 정보 로깅
        recordsToDisplay.forEach((record, index) => {
          const recordTime = moment(record.visitDateTime || record.date || record.createdAt);
          console.log(`기록 ${index + 1}:`, {
            visitDateTime: record.visitDateTime,
            date: record.date,
            createdAt: record.createdAt,
            parsedTime: recordTime.format('YYYY-MM-DD HH:mm:ss'),
            symptoms: record.symptoms,
            hasData: {
              pulseWave: !!record.pulseWave,
              memo: !!record.memo,
              stress: !!record.stress
            }
          });

          // 시간 정보가 00:00인 경우 해당 날짜의 기본 시간 설정
          if (recordTime.format('HH:mm') === '00:00') {
            const defaultTime = index === 0 ? '09:00' : 
              index === 1 ? '10:30' : 
              index === 2 ? '13:30' : 
              index === 3 ? '15:00' : 
              index === 4 ? '16:30' : '14:00';
            
            const [hour, minute] = defaultTime.split(':');
            record.visitDateTime = recordTime
              .hour(parseInt(hour))
              .minute(parseInt(minute))
              .format('YYYY-MM-DD HH:mm:ss');
          }
        });
        
        setVisitHistory(recordsToDisplay);
        console.log('진료 기록 설정 완료:', {
          totalRecords: recordsToDisplay.length,
          firstRecord: recordsToDisplay[0],
          lastRecord: recordsToDisplay[recordsToDisplay.length - 1]
        });
      } else {
        console.log('과거 진료 기록 없음 - 응답 구조:', currentPatient.patientId.records);
        setVisitHistory([]);
      }
    } catch (error) {
      console.error('진료 기록 목록 조회 실패:', error);
      setVisitHistory([]);
    }
  };

  // 컴포넌트 마운트/언마운트 시 처리
  useEffect(() => {
    if (visible) {
      // 모달이 열릴 때 초기화
      if (currentPatient?.patientId?._id) {
        loadVisitHistory(currentPatient.patientId._id);
      }
    } else {
      // 모달이 닫힐 때 초기화
      setVisitHistory([]);
      setSelectedVisitDate(null);
      setHistoricalData(null);
    }
  }, [visible]);

  const handleShowHistoryComparison = () => {
    setShowHistoryComparison(true);
  };

  const handleCloseHistoryComparison = () => {
    setShowHistoryComparison(false);
  };

  const renderPulseAnalysis = () => {
    const handleInputChange = (key, value) => {
      setPulseData(prev => {
        const newPulseData = { ...prev };
        // 입력값을 숫자로 변환
        newPulseData[key] = value === '' ? 0 : Number(value);
        
        // 맥압 계산
        if (key === 'systolicBP' || key === 'diastolicBP') {
          const sbp = Number(newPulseData.systolicBP) || 0;
          const dbp = Number(newPulseData.diastolicBP) || 0;
          newPulseData.pulsePressure = sbp - dbp;
        }
        
        // 심박수 동기화
        if (key === 'heartRate') {
          newPulseData.HR = Number(value) || 0;
        }
        
        return newPulseData;
      });
    };

    // 디버깅: 상태 확인
    console.log('🔍 renderPulseAnalysis - 상태 확인:', {
      selectedVisitDate: selectedVisitDate ? selectedVisitDate.format('YYYY-MM-DD HH:mm:ss') : null,
      historicalData: !!historicalData,
      hasHistoricalData: historicalData ? Object.keys(historicalData) : null
    });

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
          {!selectedVisitDate && (
            <ActionButton type="primary" onClick={handleSavePulseData} icon={<SaveOutlined />}>
              맥파 데이터 저장
            </ActionButton>
          )}
          {isViewingHistoricalRecord && (
            <Alert
              message="과거 진료 기록 조회 중"
              description="과거 기록은 읽기 전용입니다"
              type="info"
              showIcon
            />
          )}
        </Form>
      </PulseAnalysisCard>
    );
  };

  const renderVisitHistorySelector = () => {
    // 과거 진료 기록이 없는 경우 안내 메시지 표시
    if (!visitHistory || visitHistory.length === 0) {
      return (
        <Alert
          message="과거 진료 기록 없음"
          description="이 환자의 과거 진료 기록이 없습니다."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      );
    }

    return (
      <Space direction="vertical" style={{ marginBottom: 16, width: '100%' }}>
        <Space>
          <DatePicker
            placeholder="과거 진료 기록 선택"
            onChange={handleDateChange}
            value={selectedVisitDate}
            showTime={{ format: 'HH:mm' }}
            format="YYYY-MM-DD HH:mm"
            disabledDate={(current) => {
              // 과거 진료 날짜만 선택 가능
              const visitDates = visitHistory.map(visit => 
                moment(visit.visitDateTime || visit.date || visit.createdAt).format('YYYY-MM-DD')
              );
              return !visitDates.includes(current.format('YYYY-MM-DD'));
            }}
            style={{ width: 200 }}
            suffixIcon={<CalendarOutlined />}
          />
          {selectedVisitDate && (
            <ActionButton type="primary" onClick={returnToCurrent}>
              현재 상태로 돌아가기
            </ActionButton>
          )}
        </Space>
        
        {/* 최근 진료 기록 목록 표시 */}
        <Card 
          size="small" 
          title={
            <Space>
              <HistoryOutlined />
              <span>진료 기록</span>
              <Tag color="blue">{visitHistory.length}건</Tag>
            </Space>
          }
          style={{ marginTop: 8, borderRadius: 12, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)' }}
        >
          <div style={{ maxHeight: 150, overflowY: 'auto' }}>
            {visitHistory.map((visit, index) => {
              // 시간 정보 처리
              const visitDateTime = moment(visit.visitDateTime || visit.date || visit.createdAt);
              const now = moment();
              
              // 시간 표시 처리
              let timeStr;
              if (visitDateTime.isSame(now, 'day')) {
                // 오늘 기록인 경우 현재 시간 사용
                timeStr = now.format('HH:mm');
              } else {
                // 과거 기록의 경우 저장된 시간 사용
                timeStr = visitDateTime.format('HH:mm');
              }
              
              const dateStr = visitDateTime.format('YYYY년 MM월 DD일');
              const isSelected = selectedVisitDate && 
                selectedVisitDate.format('YYYY-MM-DD HH:mm') === visitDateTime.format('YYYY-MM-DD HH:mm');
              
              return (
                <div
                  key={`${visitDateTime.format('YYYY-MM-DD-HH-mm')}-${index}`}
                  onClick={() => handleDateChange(visitDateTime)}
                  style={{
                    padding: '12px',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? '#e6f7ff' : 'transparent',
                    borderBottom: '1px solid #f0f0f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderRadius: '8px',
                    marginBottom: '4px',
                    transition: 'all 0.3s ease',
                    border: isSelected ? '2px solid #1890ff solid transparent' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.target.style.backgroundColor = '#f5f5f5';
                      e.target.style.transform = 'translateY(-1px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.target.style.backgroundColor = 'transparent';
                      e.target.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  <Space>
                    <CalendarOutlined style={{ color: '#1890ff' }} />
                    <span style={{ fontWeight: isSelected ? 600 : 400 }}>
                      {dateStr} {timeStr}
                      {visitDateTime.isSame(now, 'day') && (
                        <Tag color="orange" style={{ marginLeft: 8 }}>오늘</Tag>
                      )}
                    </span>
                  </Space>
                  <Space>
                    {visit.symptoms && visit.symptoms.length > 0 && (
                      <Tag color="red">{visit.symptoms[0]}</Tag>
                    )}
                    {visit.pulseWave && Object.keys(visit.pulseWave).length > 0 && (
                      <Tag color="cyan">맥파</Tag>
                    )}
                  </Space>
                </div>
              );
            })}
          </div>
        </Card>
      </Space>
    );
  };

  const renderHistoricalRecord = (recordData) => {
    if (!recordData) return null;

    return (
      <StyledCard 
        title={
          <Space>
            <FileTextOutlined />
            <span>진료 기록</span>
            {selectedVisitDate && (
              <Tag color="blue">
                {moment(selectedVisitDate).format('YYYY년 MM월 DD일')} 진료
              </Tag>
            )}
          </Space>
        }
        style={{ marginTop: '1rem' }}
      >
        <Descriptions bordered column={1}>
          <Descriptions.Item 
            label={
              <Space>
                <MedicineBoxOutlined />
                <span>주요 증상</span>
              </Space>
            }
          >
            {recordData.symptoms?.map((symptom, index) => (
              <Tag key={index} color="red" style={{ margin: '2px' }}>
                {symptom}
              </Tag>
            )) || '-'}
          </Descriptions.Item>
          
          <Descriptions.Item 
            label={
              <Space>
                <HeartOutlined />
                <span>맥파 데이터</span>
              </Space>
            }
          >
            <Row gutter={[16, 8]}>
              <Col span={8}>
                <Statistic 
                  title="수축기 혈압" 
                  value={recordData.pulseWave?.systolicBP || '-'} 
                  suffix="mmHg"
                />
              </Col>
              <Col span={8}>
                <Statistic 
                  title="이완기 혈압" 
                  value={recordData.pulseWave?.diastolicBP || '-'} 
                  suffix="mmHg"
                />
              </Col>
              <Col span={8}>
                <Statistic 
                  title="심박수" 
                  value={recordData.pulseWave?.heartRate || '-'} 
                  suffix="bpm"
                />
              </Col>
            </Row>
          </Descriptions.Item>

          <Descriptions.Item 
            label={
              <Space>
                <BookOutlined />
                <span>복용 약물</span>
              </Space>
            }
          >
            {recordData.medications?.map((med, index) => (
              <Tag key={index} color="green" style={{ margin: '2px' }}>
                {med}
              </Tag>
            )) || '-'}
          </Descriptions.Item>

          <Descriptions.Item 
            label={
              <Space>
                <DashboardOutlined />
                <span>스트레스 수준</span>
              </Space>
            }
          >
            {recordData.stress ? (
              <Tag color={
                typeof recordData.stress === 'string' ? (
                  recordData.stress.includes('높') ? 'red' : 
                  recordData.stress.includes('중') ? 'orange' : 
                  'green'
                ) : (
                  recordData.stress.level?.includes('높') || recordData.stress.level === 'high' ? 'red' :
                  recordData.stress.level?.includes('중') || recordData.stress.level === 'normal' ? 'orange' :
                  'green'
                )
              }>
                {typeof recordData.stress === 'string' ? 
                  recordData.stress : 
                  `${recordData.stress.level || '보통'} (${recordData.stress.score || 0}점)`
                }
              </Tag>
            ) : '-'}
          </Descriptions.Item>

          <Descriptions.Item 
            label={
              <Space>
                <FileTextOutlined />
                <span>진료 메모</span>
              </Space>
            }
          >
            <div style={{ 
              whiteSpace: 'pre-wrap', 
              backgroundColor: '#f5f5f5', 
              padding: '8px', 
              borderRadius: '4px' 
            }}>
              {recordData.memo || '-'}
            </div>
          </Descriptions.Item>

          {recordData.pulseAnalysis && (
            <Descriptions.Item 
              label={
                <Space>
                  <HeartOutlined />
                  <span>맥상 분석</span>
                </Space>
              }
            >
              <div style={{ 
                whiteSpace: 'pre-wrap', 
                backgroundColor: '#f5f5f5', 
                padding: '8px', 
                borderRadius: '4px' 
              }}>
                {recordData.pulseAnalysis}
              </div>
            </Descriptions.Item>
          )}
        </Descriptions>
      </StyledCard>
    );
  };

  const renderContent = () => {
    console.log('renderContent called:', { loading, currentPatient, error });
    
    if (loading) {
      return <Spin tip="불러오는 중..." />;
    }

    if (error) {
      return <Alert message={error} type="error" showIcon />;
    }

    if (!currentPatient && !selectedPatientId) {
      return <Alert message="선택된 환자가 없습니다." type="info" showIcon />;
    }

    const recordData = historicalData || {};

    return (
      <TabContainer>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab={<span><UserOutlined />환자 정보</span>} key="1">
            <HistoryControls>
              {renderVisitHistorySelector()}
            </HistoryControls>

            <StyledCard 
              title={
                <Space>
                  <UserOutlined />
                  <span>기본 정보</span>
                </Space>
              }
            >
              <Descriptions bordered column={2}>
                {getBasicInfoData(currentPatient).map((item, index) => (
                  <Descriptions.Item key={index} label={item.label}>
                    {item.value}
                  </Descriptions.Item>
                ))}
              </Descriptions>
            </StyledCard>

            {/* 과거 진료 기록 표시 */}
            {renderHistoricalRecord(recordData)}
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
                    disabled={!!selectedVisitDate}
                  />
                </Form.Item>
                <Form.Item label="메모">
                  <TextArea
                    rows={4}
                    placeholder="진료 메모를 입력하세요"
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    disabled={!!selectedVisitDate}
                  />
                </Form.Item>
                <Form.Item label="스트레스">
                  <Input
                    placeholder="스트레스 정보"
                    value={stress}
                    onChange={(e) => setStress(e.target.value)}
                    disabled={!!selectedVisitDate}
                  />
                </Form.Item>
                {!selectedVisitDate && (
                  <ActionButton type="primary" icon={<SaveOutlined />} onClick={handleSaveNote}>
                    저장
                  </ActionButton>
                )}
                {selectedVisitDate && historicalData && Object.keys(historicalData).length > 0 && selectedVisitDate.isBefore(moment(), 'day') && (
                  <Alert
                    message="과거 진료 기록을 조회 중입니다"
                    description="과거 기록은 수정할 수 없습니다"
                    type="info"
                    showIcon
                  />
                )}
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
                    disabled={!!selectedVisitDate}
                  />
                </Form.Item>
                {!selectedVisitDate && (
                  <ActionButton type="primary" icon={<SaveOutlined />} onClick={handleSaveNote}>
                    저장
                  </ActionButton>
                )}
                {selectedVisitDate && historicalData && Object.keys(historicalData).length > 0 && selectedVisitDate.isBefore(moment(), 'day') && (
                  <Alert
                    message="과거 진료 기록을 조회 중입니다"
                    description="과거 기록은 읽기 전용입니다"
                    type="info"
                    showIcon
                  />
                )}
              </Form>
            </MacSangCard>
          </TabPane>
        </Tabs>
      </TabContainer>
    );
  };

  // 날짜 선택 시 처리
  const assignDefaultTime = (record, index) => {
    const recordTime = moment(record.visitDateTime || record.date || record.createdAt);
    if (recordTime.format('HH:mm') === '00:00') {
      const defaultTime = index === 0 ? '09:00' : 
        index === 1 ? '10:30' : 
        index === 2 ? '13:30' : 
        index === 3 ? '15:00' : 
        index === 4 ? '16:30' : '14:00';
      
      const [hour, minute] = defaultTime.split(':');
      return recordTime
        .hour(parseInt(hour))
        .minute(parseInt(minute))
        .format('YYYY-MM-DD HH:mm:ss');
    }
    return record.visitDateTime || record.date || record.createdAt;
  };

  const handleDateChange = async (date) => {
    if (!date) {
      returnToCurrent();
      return;
    }

    console.log('선택된 날짜/시간:', date.format('YYYY-MM-DD HH:mm:ss'));
    
    try {
      setLoading(true);
      if (!currentPatient?.patientId?._id) return;

      const records = currentPatient.patientId.records || [];
      console.log('과거 진료 기록 응답:', {
        totalRecords: records.length,
        firstRecord: records[0],
        lastRecord: records[records.length - 1]
      });
      
      // API 응답에서 records 배열 추출
      let recordsToDisplay = [];
      if (records && Array.isArray(records)) {
        recordsToDisplay = records;
      }

      // 날짜별로 정렬하고 시간 정보 처리
      recordsToDisplay.sort((a, b) => {
        const dateA = moment(a.visitDateTime || a.date || a.createdAt);
        const dateB = moment(b.visitDateTime || b.date || b.createdAt);
        return dateB.valueOf() - dateA.valueOf();
      });

      // 각 기록에 기본 시간 할당
      recordsToDisplay = recordsToDisplay.map((record, index) => ({
        ...record,
        visitDateTime: assignDefaultTime(record, index)
      }));

      console.log('시간 정보가 처리된 진료 기록:', {
        totalRecords: recordsToDisplay.length,
        recordDates: recordsToDisplay.map(r => ({
          date: moment(r.visitDateTime).format('YYYY-MM-DD'),
          time: moment(r.visitDateTime).format('HH:mm:ss')
        }))
      });

      if (recordsToDisplay && recordsToDisplay.length > 0) {
        // 선택된 날짜의 기록 찾기
        const targetDate = date.format('YYYY-MM-DD');
        const selectedRecords = recordsToDisplay.filter(record => {
          const recordDate = moment(record.visitDateTime).format('YYYY-MM-DD');
          return recordDate === targetDate;
        });

        console.log('선택된 날짜의 기록:', {
          targetDate,
          foundRecords: selectedRecords.length,
          records: selectedRecords.map(r => ({
            date: moment(r.visitDateTime).format('YYYY-MM-DD HH:mm:ss'),
            symptoms: r.symptoms
          }))
        });

        if (selectedRecords.length > 0) {
          // 가장 적절한 기록 선택 (시간이 가장 가까운 기록)
          const selectedRecord = selectedRecords.reduce((closest, current) => {
            const currentTime = moment(current.visitDateTime);
            const closestTime = moment(closest.visitDateTime);
            
            const currentDiff = Math.abs(currentTime.diff(date));
            const closestDiff = Math.abs(closestTime.diff(date));
            
            return currentDiff < closestDiff ? current : closest;
          }, selectedRecords[0]);

          console.log('선택된 기록 상세:', {
            recordTime: moment(selectedRecord.visitDateTime).format('YYYY-MM-DD HH:mm:ss'),
            symptoms: selectedRecord.symptoms,
            hasData: {
              pulseWave: !!selectedRecord.pulseWave,
              memo: !!selectedRecord.memo,
              stress: !!selectedRecord.stress
            }
          });

          // 과거 기록 데이터 설정
          setSymptoms(selectedRecord.symptoms || []);
          setMemo(selectedRecord.memo || '');
          
          // 스트레스 데이터 처리
          let stressText = '';
          if (selectedRecord.stress) {
            if (typeof selectedRecord.stress === 'object') {
              stressText = `${selectedRecord.stress.level} (${selectedRecord.stress.score}점)`;
            } else {
              stressText = selectedRecord.stress;
            }
          }
          setStress(stressText);
          
          setPulseAnalysis(selectedRecord.pulseAnalysis || '');
          
          // 맥파 데이터 설정
          if (selectedRecord.pulseWave) {
            const pulseWaveData = {
              systolicBP: selectedRecord.pulseWave.systolicBP || '',
              diastolicBP: selectedRecord.pulseWave.diastolicBP || '',
              heartRate: selectedRecord.pulseWave.heartRate || '',
              pulsePressure: selectedRecord.pulseWave.pulsePressure || '',
              'a-b': selectedRecord.pulseWave['a-b'] || '',
              'a-c': selectedRecord.pulseWave['a-c'] || '',
              'a-d': selectedRecord.pulseWave['a-d'] || '',
              'a-e': selectedRecord.pulseWave['a-e'] || '',
              'b/a': selectedRecord.pulseWave['b/a'] || '',
              'c/a': selectedRecord.pulseWave['c/a'] || '',
              'd/a': selectedRecord.pulseWave['d/a'] || '',
              'e/a': selectedRecord.pulseWave['e/a'] || '',
              elasticityScore: selectedRecord.pulseWave.elasticityScore || '',
              PVC: selectedRecord.pulseWave.PVC || '',
              BV: selectedRecord.pulseWave.BV || '',
              SV: selectedRecord.pulseWave.SV || '',
              HR: selectedRecord.pulseWave.HR || selectedRecord.pulseWave.heartRate || ''
            };
            setPulseData(convertPulseDataToNumbers(pulseWaveData));
          }
          
          // 정확한 시간 설정
          const formattedTime = moment(selectedRecord.visitDateTime).format('YYYY년 MM월 DD일 HH시 mm분');
          setVisitTime(formattedTime);
          
          // 실제 과거 기록이 로드된 경우에만 상태 설정
          setHistoricalData(selectedRecord);
          setSelectedVisitDate(date);
          setIsViewingHistoricalRecord(true); // 과거 기록 조회 상태 표시
          
          // 과거 기록임을 표시
          message.info('과거 진료 기록을 조회합니다. 과거 기록은 수정할 수 없습니다.');
        } else {
          console.log('선택한 날짜의 기록을 찾을 수 없음:', {
            targetDate: date.format('YYYY-MM-DD'),
            availableDates: recordsToDisplay.map(r => 
              moment(r.visitDateTime).format('YYYY-MM-DD')
            )
          });
          message.warning('선택한 날짜의 진료 기록을 찾을 수 없습니다.');
          returnToCurrent();
        }
      } else {
        console.log('진료 기록이 없음:', records);
        message.warning('과거 진료 기록이 없습니다.');
        returnToCurrent();
      }
    } catch (error) {
      console.error('진료 기록 로드 실패:', error);
      message.error('진료 기록을 불러오는데 실패했습니다.');
      returnToCurrent();
    } finally {
      setLoading(false);
    }
  };

  // 현재 상태로 돌아가기
  const returnToCurrent = () => {
    console.log('현재 상태로 돌아가기 - 상태 초기화');
    setSelectedVisitDate(null);
    setHistoricalData(null);
    setIsViewingHistoricalRecord(false); // 과거 기록 조회 상태 해제
    
    // 현재 환자 정보로 모든 상태 초기화
    if (currentPatient?.patientId) {
      // 상태 업데이트
      setSymptoms(currentPatient.symptoms || []);
      setMemo(currentPatient.memo || '');
      setStress(currentPatient.stress || '');
      setPulseAnalysis(currentPatient.pulseAnalysis || '');
      setMedication(currentPatient.medication || []);
      
      // 맥파 데이터 초기화
      const currentPulseWave = currentPatient.patientId.latestPulseWave || {};
      const pulseWaveData = {
        systolicBP: currentPulseWave.systolicBP || '',
        diastolicBP: currentPulseWave.diastolicBP || '',
        heartRate: currentPulseWave.heartRate || '',
        pulsePressure: currentPulseWave.pulsePressure || '',
        'a-b': currentPulseWave['a-b'] || '',
        'a-c': currentPulseWave['a-c'] || '',
        'a-d': currentPulseWave['a-d'] || '',
        'a-e': currentPulseWave['a-e'] || '',
        'b/a': currentPulseWave['b/a'] || '',
        'c/a': currentPulseWave['c/a'] || '',
        'd/a': currentPulseWave['d/a'] || '',
        'e/a': currentPulseWave['e/a'] || '',
        elasticityScore: currentPulseWave.elasticityScore || '',
        PVC: currentPulseWave.PVC || '',
        BV: currentPulseWave.BV || '',
        SV: currentPulseWave.SV || '',
        HR: currentPulseWave.HR || currentPulseWave.heartRate || ''
      };
      setPulseData(convertPulseDataToNumbers(pulseWaveData));
      
      console.log('✅ 현재 상태로 복원 완료:', {
        patientName: currentPatient.patientId?.basicInfo?.name,
        selectedVisitDate: null,
        historicalData: null
      });
    }
  };

  // 맥파 데이터를 숫자로 변환하는 함수
  const convertPulseDataToNumbers = (data) => {
    const result = {};
    Object.entries(data).forEach(([key, value]) => {
      result[key] = value === '' ? 0 : Number(value);
    });
    return result;
  };

  // 모달 렌더링
  return (
    <>
      {console.log('🔍 DoctorView 렌더링:', { visible, currentPatient, loading, error, isFullPage })}
      {isFullPage ? (
        // 전체 페이지 모드
        <div style={{ 
          maxWidth: 1200, 
          margin: '0 auto', 
          padding: 32,
          background: '#fff',
          borderRadius: 18,
          boxShadow: '0 4px 24px rgba(24, 0, 0, 0.08)',
          minHeight: 'calc(100vh - 64px)',
          position: 'relative'
        }}>
          {/* 헤더 섹션 */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24,
            padding: '20px 0',
            borderBottom: '2px solid #f0f0f0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <UserOutlined style={{ fontSize: 32, color: '#1976D2' }} />
              <div>
                <h1 style={{ 
                  margin: 0, 
                  fontSize: '28px', 
                  fontWeight: 700,
                  color: '#1976D2',
                  background: 'linear-gradient(135deg, #1976D2 0%, #1565C0 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  {currentPatient
                    ? `${currentPatient.patientId?.basicInfo?.name} (Q${String(currentPatient.queueNumber).padStart(3, '0')})`
                    : '진료실'
                  }
                </h1>
                <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                  환자 진료 및 기록 관리
                </p>
              </div>
            </div>
            <Button
              type="primary"
              icon={<CloseOutlined />}
              onClick={onClose}
              style={{
                background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                border: 'none',
                borderRadius: '8px',
                height: '40px',
                width: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            />
          </div>
          
          {/* 진료 시간 입력 필드 추가 (숨김) */}
          <input
            type="text"
            className="visit-time-input"
            style={{ display: 'none' }}
          />
          {renderContent()}
        </div>
      ) : (
        // 모달 모드
        <UnifiedModal
          title={
            currentPatient
              ? `${currentPatient.patientId?.basicInfo?.name} (Q${String(currentPatient.queueNumber).padStart(3, '0')})`
              : '진료실'
          }
          icon={UserOutlined}
          open={visible}
          onClose={onClose}
          width={1200}
          style={{ top: 50 }}
        >
          {/* 진료 시간 입력 필드 추가 (숨김) */}
          <input
            type="text"
            className="visit-time-input"
            style={{ display: 'none' }}
          />
          {renderContent()}
        </UnifiedModal>
      )}
    </>
  );
};

export default DoctorView;