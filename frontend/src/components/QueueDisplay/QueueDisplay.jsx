// src/components/QueueDisplay/QueueDisplay.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Typography, message, Button, Spin } from 'antd';
import { FullscreenOutlined, FullscreenExitOutlined } from '@ant-design/icons';
import { queueApi } from '../../api/queueApi';
import {
  Container,
  ControlBar,
  QueueList,
  QueueCard,
  PatientNameText,
  CallStatus,
  FullscreenButton
} from './styles';

const { Title } = Typography;

const QueueDisplay = ({ visible, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [queueItems, setQueueItems] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const loadQueueList = async () => {
    try {
      setLoading(true);
      const response = await queueApi.getQueue();
      if (response.success) {
        setQueueItems(response.data);
      }
    } catch (error) {
      console.error('❌ 대기목록 조회 실패:', error);
      message.error('대기목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCallPatient = async (queueItem) => {
    try {
      await queueApi.callPatient(queueItem._id);
      message.success(`${queueItem.patientId?.basicInfo?.name || '환자'}님을 호출했습니다.`);
      loadQueueList();
    } catch (error) {
      console.error('❌ 환자 호출 실패:', error);
      message.error('환자 호출에 실패했습니다.');
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    if (visible) {
      loadQueueList();
      const interval = setInterval(loadQueueList, 30000);
      return () => clearInterval(interval);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal
      title="대기자 현황"
      open={visible}
      onCancel={onClose}
      width={800}
      footer={null}
    >
      <Container>
        <ControlBar>
          <Title level={4}>현재 대기 인원: {queueItems.length}명</Title>
          <FullscreenButton onClick={toggleFullscreen}>
            {isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
          </FullscreenButton>
        </ControlBar>

        {loading ? (
          <Spin size="large" />
        ) : (
          <QueueList>
            {queueItems.map(item => (
              <QueueCard 
                key={item._id}
                $isCalled={item.status === 'called'}
              >
                <PatientNameText>
                  {item.patientId?.basicInfo?.name || '이름 없음'} ({item.queueNumber})
                </PatientNameText>
                <CallStatus $status={item.status}>
                  {item.status === 'waiting' ? '대기중' : 
                   item.status === 'called' ? '호출됨' : 
                   item.status === 'consulting' ? '진료중' : '완료'}
                </CallStatus>
                {item.status === 'waiting' && (
                  <Button 
                    type="primary"
                    onClick={() => handleCallPatient(item)}
                    style={{ marginLeft: '16px' }}
                  >
                    호출
                  </Button>
                )}
              </QueueCard>
            ))}
          </QueueList>
        )}
      </Container>
    </Modal>
  );
};

export default QueueDisplay;
