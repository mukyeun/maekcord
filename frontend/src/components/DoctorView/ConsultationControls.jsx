import React from 'react';
import { Card, Button, Space, message } from 'antd';
import * as queueApi from '../../api/queueApi';

const ConsultationControls = ({ onStatusChange }) => {
  const [currentPatient, setCurrentPatient] = React.useState(null);

  // 현재 진료중인 환자 정보 조회
  const fetchCurrentPatient = async () => {
    try {
      const response = await queueApi.getCurrentPatient();
      if (response.success) {
        setCurrentPatient(response.data);
      } else {
        console.error('현재 환자 정보 조회 실패:', response.error);
      }
    } catch (error) {
      console.error('현재 환자 정보 조회 실패:', error);
    }
  };

  // 다음 환자 호출
  const callNextPatient = async () => {
    try {
      const queueList = await queueApi.getQueueList();
      if (!queueList || !Array.isArray(queueList)) {
        message.error('대기 목록 조회 실패');
        return;
      }

      const nextPatient = queueList.find(p => p.status === 'WAITING');
      if (nextPatient) {
        const response = await queueApi.updateQueueStatus(nextPatient._id, 'CALLED');
        if (response.success) {
          message.success('다음 환자를 호출했습니다.');
          fetchCurrentPatient();
          onStatusChange?.();
        } else {
          message.error('환자 상태 업데이트 실패');
        }
      } else {
        message.info('대기 중인 환자가 없습니다.');
      }
    } catch (error) {
      console.error('다음 환자 호출 실패:', error);
      message.error('다음 환자 호출 실패');
    }
  };

  // 진료 시작
  const startConsultation = async () => {
    if (!currentPatient?._id) return;
    try {
      await queueApi.updateQueueStatus(currentPatient._id, 'CONSULTING');
      message.success('진료를 시작합니다.');
      fetchCurrentPatient();
      onStatusChange?.();
    } catch (error) {
      message.error('진료 시작 실패');
    }
  };

  // 진료 완료 및 다음 환자 자동 호출
  const completeConsultation = async () => {
    if (!currentPatient?._id) return;
    try {
      await queueApi.updateQueueStatus(currentPatient._id, 'COMPLETED');
      message.success('진료가 완료되었습니다.');
      // 자동으로 다음 환자 호출
      await callNextPatient();
    } catch (error) {
      message.error('진료 완료 처리 실패');
    }
  };

  React.useEffect(() => {
    fetchCurrentPatient();
  }, []);

  return (
    <Card title="진료 상태 관리" style={{ marginBottom: 16 }}>
      <Space>
        {!currentPatient && (
          <Button type="primary" onClick={callNextPatient}>
            다음 환자 호출
          </Button>
        )}
        {currentPatient?.status === 'CALLED' && (
          <Button type="primary" onClick={startConsultation}>
            진료 시작
          </Button>
        )}
        {currentPatient?.status === 'CONSULTING' && (
          <Button type="primary" onClick={completeConsultation}>
            진료 완료
          </Button>
        )}
      </Space>
    </Card>
  );
};

export default ConsultationControls; 