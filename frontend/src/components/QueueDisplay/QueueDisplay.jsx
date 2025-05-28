// src/components/QueueDisplay/QueueDisplay.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Modal, List, Typography, Space, Alert, Switch, Radio, Input, Drawer, Descriptions, Tag, Tabs, message, Button } from 'antd';
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
import { wsClient } from '../../utils/websocket';
import { speak, initSpeech } from '../../utils/speechUtils';
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
const MotionCard = motion(StyledCard);

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
    return localStorage.getItem('queueVoiceEnabled') !== 'false';
  });
  const [activeTab, setActiveTab] = useState('1');

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
    setIsVoiceEnabled(checked);
    localStorage.setItem('queueVoiceEnabled', checked);
    
    // 음성 테스트
    if (checked) {
      speak('음성 안내가 켜졌습니다.')
        .catch(error => console.error('음성 테스트 실패:', error));
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
      if (!patient?.name) {
        console.error('환자 정보가 없습니다:', patient);
        return;
      }

      const message = `${patient.name}님, 진료실로 와주세요`;
      console.log('📢 음성 출력 시도:', message);

      if (isVoiceEnabled) {
        await speak(message);
      }
    } catch (error) {
      console.error('음성 출력 오류:', error);
      message.error('음성 출력에 실패했습니다.');
    }
  }, [isVoiceEnabled]);

  // 대기 목록 조회
  const fetchQueueList = async () => {
    try {
      setLoading(true);
      const response = await queueApi.getQueueList();
      console.log('대기 목록 응답:', response); // 디버깅용 로그

      // response가 바로 배열인 경우를 처리
      const queueData = Array.isArray(response) ? response : 
                       Array.isArray(response?.data) ? response.data :
                       response?.data?.data || [];
      
      console.log('처리된 대기 목록:', queueData);
      setQueueList(queueData);
    } catch (error) {
      console.error('대기 목록 조회 실패:', error);
      message.error('대기 목록을 불러오는데 실패했습니다.');
      setQueueList([]);
    } finally {
      setLoading(false);
    }
  };

  // WebSocket 메시지 처리
  const handleWebSocketMessage = useCallback((data) => {
    console.log('📨 WebSocket 메시지 수신:', data);
    
    if (data.type === 'QUEUE_UPDATE' && Array.isArray(data.queue)) {
      console.log('큐 업데이트:', data.queue);
      setQueueList(data.queue);
    } else if (data.type === 'PATIENT_CALLED' && data.patient) {
      handlePatientCalled(data.patient);
    }
  }, []);

  // 초기화 및 WebSocket 연결
  useEffect(() => {
    if (!visible) return;

    console.log('QueueDisplay 마운트 - 데이터 로드 시작');
    initSpeech();
    fetchQueueList();

    wsClient.connect();
    const removeListener = wsClient.addListener(handleWebSocketMessage);

    return () => {
      console.log('QueueDisplay 언마운트');
      removeListener();
      wsClient.disconnect();
    };
  }, [visible, handleWebSocketMessage]);

  // 필터링된 목록 계산
  const getFilteredList = () => {
    if (!Array.isArray(queueList)) return [];  // 배열이 아닐 경우 빈 배열 반환
    
    return queueList
      .filter(patient => {
        if (!patient?.patientId?.basicInfo?.name || !patient?.queueNumber) return false;
        return (
          patient.patientId.basicInfo.name.includes(searchText) ||
          patient.queueNumber.includes(searchText)
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
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSearch = (e) => {
    setSearchText(e.target.value);
  };

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

  return (
    <>
      <Modal
        title={
          <div className="modal-header">
            <span>대기 환자 목록</span>
            <div className="header-right">
              <span>총 {filteredList.length}명</span>
              <span>실시간 업데이트</span>
              <div className="switch-group">
                <Switch 
                  size="small" 
                  checked={isRealtime}
                  onChange={setIsRealtime}
                />
                <Switch
                  size="small"
                  checked={isVoiceEnabled}
                  onChange={handleVoiceToggle}
                />
                <Switch
                  size="small"
                  checked={isSoundEnabled}
                  onChange={handleSoundToggle}
                />
              </div>
            </div>
          </div>
        }
        open={visible}
        onCancel={onClose}
        width="500px"
        footer={null}
      >
        <div className="notification-bar">
          <span>🔊 {lastCalledPatient && lastCalledPatient.status === 'called' && lastCalledPatient.patientId?.basicInfo?.name}님 진료실로 와주세요</span>
          <span className="close">×</span>
        </div>

        <div className="tab-container">
          <Tabs 
            defaultActiveKey="1" 
            onChange={setActiveTab}
          >
            <Tabs.TabPane tab="전체" key="1" />
            <Tabs.TabPane tab="대기" key="2" />
            <Tabs.TabPane tab="호출" key="3" />
            <Tabs.TabPane tab="진료중" key="4" />
          </Tabs>

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
        title="환자 상세 정보"
        placement="right"
        onClose={() => setIsDrawerVisible(false)}
        open={isDrawerVisible}
        width={400}
      >
        {selectedPatient && (
          <>
            <Descriptions column={1} bordered>
              <Descriptions.Item label="이름">
                {selectedPatient.patientId?.basicInfo?.name || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="연락처">
                <Space>
                  <PhoneOutlined />
                  {selectedPatient.patientId?.basicInfo?.phone || '-'}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="접수 시간">
                <Space>
                  <CalendarOutlined />
                  {formatDate(selectedPatient.createdAt)}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="방문 유형">
                {selectedPatient.patientId?.basicInfo?.visitType || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="주요 증상">
                <Space wrap>
                  {selectedPatient.patientId?.symptoms?.map((symptom, index) => (
                    <Tag key={index} color="blue">{symptom}</Tag>
                  )) || '-'}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="복용 중인 약물">
                <Space wrap>
                  {selectedPatient.patientId?.medications?.map((med, index) => (
                    <Tag key={index} color="purple" icon={<MedicineBoxOutlined />}>
                      {med}
                    </Tag>
                  )) || '-'}
                </Space>
              </Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Drawer>
    </>
  );
};

export default QueueDisplay;
