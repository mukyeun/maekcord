// src/components/QueueDisplay/QueueDisplay.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Modal, List, Typography, Space, Alert, Switch, Radio, Input, Drawer, Descriptions, Tag, Tabs, message, Button, Spin } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  SoundOutlined, 
  UserOutlined, 
  ClockCircleOutlined,
  AudioMutedOutlined,
  SearchOutlined,
  PhoneOutlined,
  CalendarOutlined,
  MedicineBoxOutlined
} from '@ant-design/icons';
import * as queueApi from '../../api/queueApi';
import { useWebSocket } from '../../hooks/useWebSocket';
import { speak, initSpeech, announcePatientCall, getVoices, speakText, isSpeechSynthesisSupported, safeSpeak } from '../../utils/speechUtils';
import { soundManager } from '../../utils/sound';
import styled from 'styled-components';  // styled-components import 추가

const { Title, Text } = Typography;
const { Search } = Input;

// 상태별 설정
const STATUS_CONFIG = {
  waiting: { 
    color: 'gold', 
    text: '대기중', 
    icon: <ClockCircleOutlined /> 
  },
  called: { 
    color: 'green', 
    text: '호출됨', 
    icon: <SoundOutlined /> 
  },
  consulting: { 
    color: 'blue', 
    text: '진료중', 
    icon: <UserOutlined /> 
  },
  done: { 
    color: 'default', 
    text: '완료', 
    icon: null 
  }
};

// 애니메이션 설정
const listItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 }
};

// ✅ 1. styled-components 먼저 선언
const StyledCard = styled.div`
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 16px;
`;

const QueueItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
`;

const WaitingTime = styled.span`
  color: ${props => props.isLong ? '#ff4d4f' : '#8c8c8c'};
  font-size: 14px;
`;

const StatusBadge = styled.span`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  background-color: ${props => {
    switch (props.status) {
      case 'waiting': return '#1890ff';
      case 'called': return '#faad14';
      case 'consulting': return '#52c41a';
      default: return '#d9d9d9';
    }
  }};
  color: white;
`;

// ✅ 2. motion components 선언
const MotionCard = motion.create(StyledCard);

const QueueDisplay = ({ visible, onClose }) => {
  const [queueList, setQueueList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastCalledPatient, setLastCalledPatient] = useState(null);
  const [error, setError] = useState(null);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [isRealtime, setIsRealtime] = useState(true);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(() => {
    return localStorage.getItem('queueVoiceEnabled') !== 'false' && isSpeechSynthesisSupported();
  });
  const [activeTab, setActiveTab] = useState('1');
  const { isReady, subscribe } = useWebSocket();

  // ReceptionDashboard에서 테스트 데이터로 큐 생성
  const testPatients = [
    {
      _id: '1',
      patientId: {
        basicInfo: {
          name: '김환자',
          phone: '010-1234-5678',
          visitType: '초진'
        },
        symptoms: ['두통', '어지러움']
      },
      status: 'waiting',
      queueNumber: '001',
      createdAt: new Date().toISOString()
    },
    {
      _id: '2',
      patientId: {
        basicInfo: {
          name: '이환자',
          phone: '010-2345-6789',
          visitType: '재진'
        },
        symptoms: ['복통']
      },
      status: 'waiting',
      queueNumber: '002',
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30분 전
    }
  ];

  // localStorage에서 소리 설정 불러오기
  useEffect(() => {
    const savedSoundSetting = localStorage.getItem('queueSoundEnabled');
    if (savedSoundSetting !== null) {
      setIsSoundEnabled(savedSoundSetting === 'true');
    }
  }, []);

  useEffect(() => {
    const savedVoiceSetting = localStorage.getItem('queueVoiceEnabled');
    if (savedVoiceSetting !== null) {
      setIsVoiceEnabled(savedVoiceSetting === 'true');
    }
  }, []);

  // 소리 설정 저장
  const handleSoundToggle = (checked) => {
    setIsSoundEnabled(checked);
    localStorage.setItem('queueSoundEnabled', checked.toString());
  };

  const handleVoiceToggle = (checked) => {
    if (checked && !isSpeechSynthesisSupported()) {
      message.warning('이 브라우저는 음성 합성을 지원하지 않습니다.');
      return;
    }

    setIsVoiceEnabled(checked);
    localStorage.setItem('queueVoiceEnabled', checked);
    
    // 음성 테스트
    if (checked) {
      try {
        safeSpeak('음성 안내가 켜졌습니다.')
          .catch(error => console.error('음성 테스트 실패:', error));
      } catch (err) {
        console.error('음성 합성 사용 불가', err);
        message.error('음성 합성을 사용할 수 없습니다.');
        setIsVoiceEnabled(false);
        localStorage.setItem('queueVoiceEnabled', 'false');
      }
    }
  };

  const calculateWaitingTime = (createdAt) => {
    const waitingTime = Math.floor((Date.now() - new Date(createdAt)) / 1000 / 60);
    return waitingTime < 60 
      ? `${waitingTime}분`
      : `${Math.floor(waitingTime / 60)}시간 ${waitingTime % 60}분`;
  };

  const playCallSound = () => {
    if (isSoundEnabled) {
      soundManager.playDingDong();
    }
  };

  const handlePatientCalled = useCallback(async (patient) => {
    try {
      if (!patient?.patientId?.basicInfo?.name) return;
      
      if (isVoiceEnabled && isSpeechSynthesisSupported()) {
        await safeSpeak(`${patient.patientId.basicInfo.name}님 진료실로 들어오세요.`);
      }
    } catch (e) {
      console.error('음성합성 실패:', e);
    }
  }, [isVoiceEnabled]);

  // 대기 목록 조회
  const fetchQueueList = async () => {
    try {
      setLoading(true);
      console.log('📋 QueueDisplay - 대기 목록 조회 시작');
      const response = await queueApi.getTodayQueueList();
      console.log('🔍 QueueDisplay - 서버 응답:', response);

      // 응답 데이터 처리
      let queueData;
      if (response && Array.isArray(response.data)) {
        queueData = response.data;
      } else if (Array.isArray(response)) {
        queueData = response;
      } else if (response?.data?.data && Array.isArray(response.data.data)) {
        queueData = response.data.data;
      } else {
        throw new Error('유효하지 않은 대기 목록 데이터');
      }

      console.log('✅ QueueDisplay - 처리된 대기 목록:', queueData);
      setQueueList(queueData);
    } catch (error) {
      console.error('❌ QueueDisplay - 대기 목록 조회 실패:', error);
      message.error('대기 목록을 불러오는데 실패했습니다.');
      setQueueList([]);
    } finally {
      setLoading(false);
    }
  };

  // WebSocket 메시지 처리
  useEffect(() => {
    if (!isReady) return;

    const unsubscribe = subscribe('QUEUE_UPDATE', (data) => {
      console.log('📨 QueueDisplay - WebSocket 메시지 수신:', data);
      if (Array.isArray(data.queue)) {
        console.log('📋 QueueDisplay - 큐 목록 업데이트:', data.queue);
        setQueueList(data.queue);
      }
    });

    const unsubscribePatientCall = subscribe('PATIENT_CALLED', (data) => {
      console.log('📞 QueueDisplay - 환자 호출 이벤트:', data);
      playCallSound();
      handlePatientCalled(data.patient);
    });

    return () => {
      unsubscribe();
      unsubscribePatientCall();
    };
  }, [isReady, subscribe, handlePatientCalled]);

  // 필터링된 목록 계산
  const getFilteredList = () => {
    if (!Array.isArray(queueList)) return [];
    return queueList
      .filter(patient => {
        // 실제 데이터 구조에 맞게 수정
        const name = patient?.patientId?.basicInfo?.name || patient?.name;
        const queueNumber = patient?.queueNumber || patient?.순번;
        if (!name || !queueNumber) return false;
        if (!searchText) return true;
        return (
          name.includes(searchText) ||
          queueNumber.includes(searchText)
        );
      })
      .filter(patient => {
        switch (activeTab) {
          case '2': return patient.status === 'waiting';
          case '3': return patient.status === 'called';
          case '4': return patient.status === 'consulting';
          default: return true;
        }
      });
  };

  const filteredList = getFilteredList();

  const handlePatientClick = (patient) => {
    setSelectedPatient(patient);
    setIsDrawerVisible(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('ko-KR');
  };

  const handleSearch = (e) => {
    setSearchText(e.target.value);
  };

  // voices 대신 getVoices() 함수 사용
  const availableVoices = getVoices();

  useEffect(() => {
    console.log('대기 목록 데이터:', queueList);
  }, [queueList]);

  useEffect(() => {
    try {
      if (!isSpeechSynthesisSupported()) {
        console.warn('⚠️ 음성 합성 지원 안 됨');
        setIsVoiceEnabled(false);
        localStorage.setItem('queueVoiceEnabled', 'false');
        return;
      }

      if (lastCalledPatient?.patientId?.basicInfo?.name && isVoiceEnabled) {
        safeSpeak(`${lastCalledPatient.patientId.basicInfo.name}님 진료실로 들어오세요.`);
      }
    } catch (e) {
      console.error('음성합성 중 오류:', e);
    }
  }, [lastCalledPatient, isVoiceEnabled]);

  // 음성 합성 음성 목록 초기화 (최초 1회)
  useEffect(() => {
    if (isSpeechSynthesisSupported()) {
      window.speechSynthesis.getVoices(); // 초기화 트리거
    }
  }, []);

  useEffect(() => {
    if (visible) {
      fetchQueueList();
    }
  }, [visible]);

  if (error) {
    return (
      <Modal
        title="오류"
        open={visible}
        onCancel={onClose}
      >
        <div className="error-message">
          {error}
          <Button onClick={fetchQueueList}>다시 시도</Button>
        </div>
      </Modal>
    );
  }

  if (!isSpeechSynthesisSupported()) {
    console.warn('음성 합성 사용 불가');
  }

  return (
    <div>
      {error && (
        <Alert message="오류" description={error} type="error" showIcon style={{ marginBottom: 16 }} />
      )}
      <Spin spinning={loading} tip="불러오는 중...">
        <Modal
          title={
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'linear-gradient(135deg, #1976D2 0%, #1565C0 100%)',
                color: 'white',
                borderRadius: '16px 16px 0 0',
                padding: '20px 24px',
                margin: '-24px -24px 24px -24px',
                fontWeight: 700,
                fontSize: 22,
              }}
            >
              <span style={{ fontSize: 24, fontWeight: 700 }}>대기 환자 목록</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ fontSize: 16 }}>총 {filteredList.length}명</span>
                <span style={{ fontSize: 14, opacity: 0.8 }}>실시간 업데이트</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Switch size="small" checked={isRealtime} onChange={setIsRealtime} />
                  <Switch size="small" checked={isVoiceEnabled} onChange={handleVoiceToggle} disabled={!isSpeechSynthesisSupported()} />
                  <Switch size="small" checked={isSoundEnabled} onChange={handleSoundToggle} />
                </div>
              </div>
            </div>
          }
          open={visible}
          onCancel={onClose}
          width="500px"
          footer={null}
          styles={{
            body: { maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', background: '#f5f7fa', borderRadius: '0 0 16px 16px', padding: 24 },
            header: { borderRadius: '16px 16px 0 0', background: 'transparent' },
          }}
        >
          {!isSpeechSynthesisSupported() && (
            <Alert
              message="음성 안내 지원 안됨"
              description="이 브라우저는 음성 합성을 지원하지 않습니다."
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <div className="notification-bar">
            <span>🔊 {lastCalledPatient && lastCalledPatient.status === 'called' && lastCalledPatient.patientId?.basicInfo?.name}님 진료실로 와주세요</span>
            <span className="close">×</span>
          </div>

          <div className="tab-container">
            <Tabs 
              defaultActiveKey="1" 
              onChange={setActiveTab}
              items={[
                { label: '전체', key: '1' },
                { label: '대기', key: '2' },
                { label: '호출', key: '3' },
                { label: '진료중', key: '4' }
              ]}
            />

            <Input
              prefix={<SearchOutlined />}
              placeholder="이름 또는 번호 검색"
              className="search-input"
              value={searchText}
              onChange={handleSearch}
            />
          </div>

          <List
            loading={loading}
            dataSource={filteredList}
            locale={{ emptyText: '대기 환자가 없습니다.' }}
            renderItem={(item) => {
              const statusInfo = STATUS_CONFIG[item.status] || STATUS_CONFIG.waiting;
              const isJustCalled = item._id === lastCalledPatient?._id;

              console.log(item.patientId?.basicInfo?.name, item.queueNumber, item.createdAt);

              return (
                <AnimatePresence mode="wait">
                  <MotionCard
                    key={item._id}
                    isJustCalled={isJustCalled}
                    hoverable
                    onClick={() => handlePatientClick(item)}
                    variants={listItemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  >
                    <QueueItem>
                      <Space direction="vertical" size={2}>
                        <Space align="center">
                          <Title level={4} style={{ margin: 0 }}>
                            {item.patientId?.basicInfo?.name || '이름 없음'}
                          </Title>
                          <Text type="secondary">({item.queueNumber || '-'})</Text>
                        </Space>
                        <Space>
                          <Text type="secondary">
                            {item.patientId?.basicInfo?.visitType || '-'}
                          </Text>
                          <WaitingTime>
                            대기시간: {calculateWaitingTime(item.createdAt)}
                          </WaitingTime>
                        </Space>
                      </Space>
                      <StatusBadge 
                        status={statusInfo.color} 
                        text={
                          <Space>
                            {statusInfo.icon}
                            {statusInfo.text}
                          </Space>
                        }
                      />
                    </QueueItem>
                  </MotionCard>
                </AnimatePresence>
              );
            }}
          />

          <div className="pagination-info">
            총 {filteredList.length}개 <span className="current-page">1</span> 10 / 페이지
          </div>
        </Modal>

        <Drawer
          title={
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: 'linear-gradient(135deg, #1976D2 0%, #1565C0 100%)',
                color: 'white',
                borderRadius: '16px 16px 0 0',
                padding: '20px 24px',
                margin: '-24px -24px 24px -24px',
                fontWeight: 700,
                fontSize: 22,
              }}
            >
              <UserOutlined style={{ fontSize: 28, marginRight: 8 }} />
              환자 상세 정보
            </div>
          }
          placement="right"
          onClose={() => setIsDrawerVisible(false)}
          open={isDrawerVisible}
          width={400}
          styles={{
            body: { background: '#f5f7fa', borderRadius: '0 0 16px 16px', padding: 24 },
            header: { borderRadius: '16px 16px 0 0', background: 'transparent' },
          }}
        >
          {selectedPatient && (
            <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 2px 16px rgba(25, 118, 210, 0.08)', padding: 24 }}>
              <Descriptions column={1} bordered>
                <Descriptions.Item label={<span style={{ color: '#1976D2', fontWeight: 600 }}>이름</span>}>
                  <span style={{ fontWeight: 700, fontSize: 18 }}>{selectedPatient.patientId?.basicInfo?.name || '-'}</span>
                </Descriptions.Item>
                <Descriptions.Item label={<span style={{ color: '#1976D2', fontWeight: 600 }}>연락처</span>}>
                  <Space>
                    <PhoneOutlined />
                    {selectedPatient.patientId?.basicInfo?.phone || '-'}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label={<span style={{ color: '#1976D2', fontWeight: 600 }}>접수 시간</span>}>
                  <Space>
                    <CalendarOutlined />
                    {formatDate(selectedPatient.createdAt)}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label={<span style={{ color: '#1976D2', fontWeight: 600 }}>방문 유형</span>}>
                  <span style={{ fontWeight: 600 }}>{selectedPatient.patientId?.basicInfo?.visitType || '-'}</span>
                </Descriptions.Item>
                <Descriptions.Item label={<span style={{ color: '#1976D2', fontWeight: 600 }}>주요 증상</span>}>
                  <Space wrap>
                    {selectedPatient.patientId?.symptoms?.map((symptom, index) => (
                      <Tag key={index} color="processing" style={{ fontWeight: 600, fontSize: 15 }}>{symptom}</Tag>
                    )) || '-'}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label={<span style={{ color: '#1976D2', fontWeight: 600 }}>복용 중인 약물</span>}>
                  <Space wrap>
                    {selectedPatient.patientId?.medications?.map((med, index) => (
                      <Tag key={index} color="success" icon={<MedicineBoxOutlined />} style={{ fontWeight: 600, fontSize: 15 }}>
                        {med}
                      </Tag>
                    )) || '-'}
                  </Space>
                </Descriptions.Item>
              </Descriptions>
            </div>
          )}
        </Drawer>
      </Spin>
    </div>
  );
};

export default QueueDisplay;
