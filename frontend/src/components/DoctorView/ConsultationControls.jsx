import React, { useState, useEffect } from 'react';
import { Card, Button, Space, message, Table, Descriptions, Tag } from 'antd';
import * as queueApi from '../../api/queueApi';
import dayjs from 'dayjs';
import styled from 'styled-components';

const ConsultationCard = styled(Card)`
  border-radius: 16px !important;
  box-shadow: 0 2px 16px rgba(25, 118, 210, 0.08) !important;
  background: ${({ theme }) => theme.card} !important;
  color: ${({ theme }) => theme.text} !important;
  border: 1px solid ${({ theme }) => theme.border} !important;
  margin-bottom: 1.5rem;
  
  .ant-card-head {
    border-bottom: 1px solid ${({ theme }) => theme.border};
    background: ${({ theme }) => theme.card};
  }
  
  .ant-card-body {
    padding: 1.5rem;
    @media (max-width: 700px) {
      padding: 1rem;
    }
  }
`;

const ControlButtons = styled(Space)`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  
  .ant-btn {
    border-radius: 8px;
    font-weight: 500;
    min-width: 120px;
    
    @media (max-width: 700px) {
      min-width: 100px;
      font-size: 14px;
    }
  }
`;

const StatusDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 1rem;
  padding: 12px;
  background: ${({ theme }) => theme.background};
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.border};
  
  .status-label {
    font-weight: 600;
    color: ${({ theme }) => theme.text};
  }
  
  .ant-tag {
    border-radius: 12px;
    font-weight: 500;
  }
`;

const ConsultationControls = ({
  onStatusChange,
  symptoms,
  memo,
  stress,
  pulseAnalysis,
  status
}) => {
  const [currentPatient, setCurrentPatient] = useState(null);
  const [loading, setLoading] = useState(false);

  // 현재 환자 정보 조회
  const fetchCurrentPatient = async () => {
    try {
      setLoading(true);
      const response = await queueApi.getCurrentPatient();
      if (response.data) {
        setCurrentPatient(response.data);
      } else {
        setCurrentPatient(null);
      }
    } catch (error) {
      console.error('현재 환자 정보 조회 실패:', error);
      message.error('환자 정보 조회 실패');
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시와 상태 변경 시 현재 환자 정보 조회
  useEffect(() => {
    fetchCurrentPatient();
  }, []);

  // 다음 환자 호출
  const callNextPatient = async () => {
    console.log('callNextPatient 함수 실행');
    try {
      setLoading(true);
      const response = await queueApi.callNextPatient();
      
      if (response.data) {
        message.success('다음 환자를 호출했습니다.');
        await fetchCurrentPatient();
      } else {
        message.info('대기 중인 환자가 없습니다.');
      }
      
      onStatusChange?.();
    } catch (error) {
      console.error('다음 환자 호출 실패:', error);
      message.error('다음 환자 호출 실패');
    } finally {
      setLoading(false);
    }
  };

  // 진료 시작
  const startConsultation = async () => {
    console.log('startConsultation 함수 실행');
    try {
      setLoading(true);
      // 1. 오늘 대기열에서 'called' 상태의 환자를 찾는다
      const todayQueueListResponse = await queueApi.getTodayQueueList();
      const calledQueue = (todayQueueListResponse.data || []).find(q => q.status === 'called');
      if (!calledQueue) {
        message.warning('호출된 환자가 없습니다.');
        return;
      }

      // 2. 그 환자의 상태를 'consulting'으로 변경
      await queueApi.updateQueueStatus(
        calledQueue._id,
        'consulting',
        symptoms,
        memo,
        stress,
        pulseAnalysis
      );
      message.success('진료를 시작합니다.');
      await fetchCurrentPatient();
      onStatusChange?.();
    } catch (error) {
      console.error('진료 시작 실패:', error);
      message.error('진료 시작 실패');
    } finally {
      setLoading(false);
    }
  };

  // 진료 완료
  const completeConsultation = async () => {
    console.log('completeConsultation 함수 실행');
    try {
      setLoading(true);
      const currentPatient = await queueApi.getCurrentPatient();
      if (!currentPatient?.data?._id) {
        message.warning('진료 중인 환자가 없습니다.');
        return;
      }

      // API 요청 전 데이터 로깅
      console.log('Sending data:', {
        queueId: currentPatient.data._id,
        status: 'done',
        symptoms,
        memo,
        stress,
        pulseAnalysis
      });

      await queueApi.updateQueueStatus(
        currentPatient.data._id,
        'done',
        symptoms,
        memo,
        stress,
        pulseAnalysis
      );
      
      message.success('진료가 완료되었습니다.');
      setCurrentPatient(null);
      onStatusChange?.();
      await callNextPatient();
    } catch (error) {
      console.error('진료 완료 처리 실패:', error);
      message.error('진료 완료 처리 실패');
    } finally {
      setLoading(false);
    }
  };

  // 상태에 따른 태그 색상
  const getStatusTag = (status) => {
    const statusColors = {
      waiting: 'blue',
      called: 'orange',
      consulting: 'green',
      completed: 'gray'
    };
    return <Tag color={statusColors[status] || 'default'}>{status?.toUpperCase()}</Tag>;
  };

  return (
    <ConsultationCard title="진료 상태 관리">
      <StatusDisplay>
        <span className="status-label">현재 상태:</span>
        {getStatusTag(status)}
        {currentPatient && (
          <span style={{ color: '#666', fontSize: '14px' }}>
            환자: {currentPatient.patientId?.basicInfo?.name || '정보 없음'}
          </span>
        )}
      </StatusDisplay>
      
      <ControlButtons>
        <Button 
          type="primary" 
          onClick={callNextPatient} 
          loading={loading}
          disabled={status === 'consulting'}
        >
          다음 환자 호출
        </Button>
        <Button
          type="primary"
          onClick={() => {
            console.log('진료 시작 버튼 클릭됨');
            startConsultation();
          }}
          disabled={status !== 'called'}
          loading={loading}
        >
          진료 시작
        </Button>
        <Button 
          type="primary" 
          onClick={completeConsultation} 
          loading={loading}
          disabled={status !== 'consulting'}
        >
          진료 완료
        </Button>
      </ControlButtons>
    </ConsultationCard>
  );
};

export default ConsultationControls; 