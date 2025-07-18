// src/components/QueueDisplay/QueueDisplay.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Modal, List, Tag, Button, Space, Switch, Alert, Spin, Empty } from 'antd';
import { UserOutlined, ClockCircleOutlined, BellOutlined, SoundOutlined, AudioOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import * as queueApi from '../../api/queueApi';
import { soundManager } from '../../utils/sound';
import { speak, announceWaitingRoom, announceConsultingRoom, announcePatientCall } from '../../utils/speechUtils';
import UnifiedModal from '../Common/UnifiedModal';

const QueueItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  margin-bottom: 8px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  &.called {
    background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%);
    color: white;
    
    .ant-tag {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.3);
    }
  }
  
  &.consulting {
    background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
    color: white;
    
    .ant-tag {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.3);
    }
  }
`;

const PatientInfo = styled.div`
  flex: 1;
  
  .patient-name {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 4px;
  }
  
  .patient-details {
    font-size: 14px;
    opacity: 0.8;
  }
`;

const QueueNumber = styled.div`
  text-align: center;
  margin-right: 16px;
  
  .number {
    font-size: 24px;
    font-weight: 700;
    color: #1890ff;
  }
  
  .label {
    font-size: 12px;
    color: #666;
    margin-top: 4px;
  }
`;

const StatusTag = styled(Tag)`
  font-weight: 600;
  border-radius: 12px;
  padding: 4px 12px;
`;

const ControlPanel = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  backdrop-filter: blur(10px);
`;

const SwitchGroup = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
  
  .switch-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 500;
  }
`;

const QueueDisplay = ({ visible, onClose, queueList = [] }) => {
  const [isRealtime, setIsRealtime] = useState(true);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastCalledQueue, setLastCalledQueue] = useState(null);

  // 음성 합성 지원 여부 확인
  const isSpeechSynthesisSupported = () => {
    return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  };

  // 대기열 목록 필터링
  const filteredList = useMemo(() => {
    return queueList.filter(queue => 
      queue.status === 'waiting' || queue.status === 'called' || queue.status === 'consulting'
    );
  }, [queueList]);

  // 환자 호출 처리
  const handleCallPatient = useCallback(async (queue) => {
    try {
      setLoading(true);
      
      // 대기열 상태 업데이트
      await queueApi.updateQueueStatus(queue._id, 'called');
      
      // 음성 안내
      if (isVoiceEnabled && isSpeechSynthesisSupported()) {
        announcePatientCall(queue.patientId?.basicInfo?.name, queue.queueNumber);
      }
      
      // 소리 재생
      if (isSoundEnabled) {
        soundManager.playCallSound();
      }
      
      setLastCalledQueue(queue);
      
      // 3초 후 호출 상태 해제
      setTimeout(() => {
        setLastCalledQueue(null);
      }, 3000);
      
    } catch (error) {
      console.error('환자 호출 실패:', error);
      setError('환자 호출 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [isVoiceEnabled, isSoundEnabled]);

  // 실시간 토글 처리
  const handleRealtimeToggle = useCallback((checked) => {
    setIsRealtime(checked);
  }, []);

  // 음성 토글 처리
  const handleVoiceToggle = useCallback((checked) => {
    setIsVoiceEnabled(checked);
    if (checked && !isSpeechSynthesisSupported()) {
      console.warn('이 브라우저는 음성 합성을 지원하지 않습니다.');
    }
  }, []);

  // 소리 토글 처리
  const handleSoundToggle = useCallback((checked) => {
    setIsSoundEnabled(checked);
  }, []);

  // 상태별 태그 색상
  const getStatusColor = (status) => {
    switch (status) {
      case 'waiting': return 'orange';
      case 'called': return 'green';
      case 'consulting': return 'blue';
      case 'done': return 'default';
      default: return 'default';
    }
  };

  // 상태별 텍스트
  const getStatusText = (status) => {
    switch (status) {
      case 'waiting': return '대기 중';
      case 'called': return '호출됨';
      case 'consulting': return '진료 중';
      case 'done': return '완료';
      default: return status;
    }
  };

  return (
    <div>
      {error && (
        <Alert message="오류" description={error} type="error" showIcon style={{ marginBottom: 16 }} />
      )}
      <Spin spinning={loading} tip="불러오는 중...">
        <UnifiedModal
          title="대기 환자 목록"
          icon={UserOutlined}
          open={visible}
          onClose={onClose}
          width={600}
        >
          <div style={{ background: 'white', borderRadius: 16, padding: 16, boxShadow: '0 2px 16px rgba(25, 118, 210, 0.08)', marginBottom: 24 }}>
            <ControlPanel>
              <div>
                <span style={{ fontWeight: 600, fontSize: 16 }}>총 {filteredList.length}명</span>
                <span style={{ marginLeft: 8, color: '#666', fontSize: 14 }}>실시간 업데이트</span>
              </div>
              <SwitchGroup>
                <div className="switch-item">
                  <Switch 
                    size="small" 
                    checked={isRealtime}
                    onChange={handleRealtimeToggle}
                  />
                  <span>실시간</span>
                </div>
                <div className="switch-item">
                  <Switch
                    size="small"
                    checked={isVoiceEnabled}
                    onChange={handleVoiceToggle}
                    disabled={!isSpeechSynthesisSupported()}
                  />
                  <AudioOutlined />
                </div>
                <div className="switch-item">
                  <Switch
                    size="small"
                    checked={isSoundEnabled}
                    onChange={handleSoundToggle}
                  />
                  <SoundOutlined />
                </div>
              </SwitchGroup>
            </ControlPanel>

            {!isSpeechSynthesisSupported() && (
              <Alert
                message="음성 안내 지원 안됨"
                description="이 브라우저는 음성 합성을 지원하지 않습니다."
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            {filteredList.length === 0 ? (
              <Empty 
                description="대기 중인 환자가 없습니다"
                style={{ margin: '40px 0' }}
              />
            ) : (
              <List
                dataSource={filteredList}
                renderItem={(queue) => (
                  <QueueItem 
                    key={queue._id}
                    className={queue.status}
                    onClick={() => handleCallPatient(queue)}
                    style={{ cursor: 'pointer' }}
                  >
                    <QueueNumber>
                      <div className="number">Q{String(queue.queueNumber).padStart(3, '0')}</div>
                      <div className="label">대기번호</div>
                    </QueueNumber>
                    
                    <PatientInfo>
                      <div className="patient-name">
                        {queue.patientId?.basicInfo?.name || '이름 없음'}
                      </div>
                      <div className="patient-details">
                        {queue.visitType || '초진'} • {queue.patientId?.basicInfo?.phone || '연락처 없음'}
                      </div>
                    </PatientInfo>
                    
                    <StatusTag color={getStatusColor(queue.status)}>
                      {getStatusText(queue.status)}
                    </StatusTag>
                  </QueueItem>
                )}
              />
            )}
          </div>
        </UnifiedModal>
      </Spin>
    </div>
  );
};

export default QueueDisplay;
