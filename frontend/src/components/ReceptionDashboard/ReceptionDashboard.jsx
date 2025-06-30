import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Modal, Table, Tag, Button, Space, Drawer, Descriptions, message, Dropdown, Input, Select, Alert, Spin, Empty, Card } from 'antd';
import { UserOutlined, ReloadOutlined, BellOutlined, MoreOutlined, SearchOutlined, LoadingOutlined, EllipsisOutlined, BugOutlined, MedicineBoxOutlined } from '@ant-design/icons';
import {
  DashboardWrapper,
  StyledTable,
  StatusBadge,
  DetailCard,
  ActionButton,
  RefreshButton,
  PatientInfo,
  DrawerContent,
  VisitTypeBadge
} from './styles';
import * as queueApi from '../../api/queueApi';
import styled, { css, keyframes } from 'styled-components';
import QueueDisplay from '../QueueDisplay/QueueDisplay';
import { soundManager } from '../../utils/sound';
import { wsClient } from '../../utils/websocket';
import { debounce } from 'lodash';
import './styles.css';
import { speak, announceWaitingRoom, announceConsultingRoom, announcePatientCall } from '../../utils/speechUtils';
import WaitingList from './WaitingList';
import { useNavigate, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import useRealtimeData from '../../hooks/useRealtimeData';
import useKeyboardShortcuts from '../../hooks/useKeyboardShortcuts';
import { useDebounce, useDeepMemo } from '../../hooks/useMemoization';

const DashboardContainer = styled.div`
  padding: 24px;
  background: ${({ theme }) => theme.background};
  min-height: 100vh;
  @media (max-width: 700px) {
    padding: 1rem;
  }
`;

const { Search } = Input;
const { Option } = Select;

const ResponsiveGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
`;

const DashboardCard = styled(Card)`
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

const SearchCard = styled(Card)`
  border-radius: 16px !important;
  box-shadow: 0 2px 16px rgba(25, 118, 210, 0.08) !important;
  background: ${({ theme }) => theme.card} !important;
  color: ${({ theme }) => theme.text} !important;
  border: 1px solid ${({ theme }) => theme.border} !important;
  margin-bottom: 1.5rem;
  
  .ant-card-body {
    padding: 1.5rem;
    @media (max-width: 700px) {
      padding: 1rem;
    }
  }
`;

const TableCard = styled(Card)`
  border-radius: 16px !important;
  box-shadow: 0 2px 16px rgba(25, 118, 210, 0.08) !important;
  background: ${({ theme }) => theme.card} !important;
  color: ${({ theme }) => theme.text} !important;
  border: 1px solid ${({ theme }) => theme.border} !important;
  
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
  
  .ant-table {
    background: ${({ theme }) => theme.card};
    color: ${({ theme }) => theme.text};
  }
  
  .ant-table-thead > tr > th {
    background: ${({ theme }) => theme.card};
    color: ${({ theme }) => theme.text};
    border-bottom: 1px solid ${({ theme }) => theme.border};
  }
  
  .ant-table-tbody > tr > td {
    border-bottom: 1px solid ${({ theme }) => theme.border};
  }
  
  .ant-table-tbody > tr:hover > td {
    background: ${({ theme }) => theme.hover};
  }
`;

const ReceptionDashboard = (props) => {
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [isQueueDisplayVisible, setIsQueueDisplayVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastCalledPatient, setLastCalledPatient] = useState(null);
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector(state => state.auth);

  // 검색창 ref 선언
  const searchInputRef = useRef(null);

  // 디바운스된 검색 텍스트 (300ms 지연)
  const debouncedSearchText = useDebounce(searchText, 300);

  // onDataUpdate 콜백을 useCallback으로 감싸기
  const handleDataUpdate = useCallback((data) => {
    console.log('✅ 대기 목록 실시간 업데이트:', data);
  }, []);

  const handleDataError = useCallback((error) => {
    console.error('❌ 대기 목록 조회 실패:', error);
    message.error('대기 목록을 불러오는데 실패했습니다.');
  }, []);

  // 실시간 데이터 훅 사용
  const {
    data: queueList,
    loading,
    error,
    lastUpdate,
    isOnline,
    refresh,
    updateItem,
    removeItem,
    addItem,
    connectionStatus,
    isConnected
  } = useRealtimeData('queue', queueApi.getTodayQueueList, {
    autoConnect: true,
    pollingInterval: 600000, // 10분으로 증가
    enableWebSocket: true,
    onDataUpdate: handleDataUpdate,
    onError: handleDataError
  });

  // 수동 새로고침 (shortcuts 선언보다 위에서 선언)
  const handleRefresh = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await refresh();
      message.success('목록이 새로고침되었습니다.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // 단축키 정의 및 훅 호출 (항상 최상단에서 호출)
  const shortcuts = {
    'ctrl+r': { description: '목록 새로고침', action: handleRefresh },
    'ctrl+f': { description: '검색창 포커스', action: () => searchInputRef.current?.focus() },
    'ctrl+q': { description: '대기열 화면 열기', action: () => setIsQueueDisplayVisible(true) },
    'esc':    { description: '상세 닫기', action: () => setDetailVisible(false) }
  };
  useKeyboardShortcuts(shortcuts, true);

  // 메모이즈된 필터링 로직 (항상 최상단에서 호출)
  const filteredData = useMemo(() => {
    // queueList가 undefined나 null이면 빈 배열 사용
    let result = Array.isArray(queueList) ? [...queueList] : [];
    
    if (statusFilter !== 'all') {
      result = result.filter(item => item.status === statusFilter);
    }
    
    if (debouncedSearchText) {
      const searchLower = debouncedSearchText.toLowerCase();
      result = result.filter(item => 
        item.patientId?.basicInfo?.name?.toLowerCase().includes(searchLower) ||
        item.queueNumber?.toString().includes(searchLower) ||
        item.patientId?.basicInfo?.phone?.includes(debouncedSearchText)
      );
    }
    
    return result;
  }, [queueList, debouncedSearchText, statusFilter]);

  console.log('isAuthenticated', isAuthenticated, 'loading', loading, 'error', error, 'queueList', queueList);

  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (error) {
    return <Alert message="데이터 로드 실패" description={error} type="error" showIcon />;
  }
  if (loading) {
    return <Spin tip="대기 목록을 불러오는 중..."><div className="content" /></Spin>;
  }

  const handleCallPatient = async (queue) => {
    const queueId = queue?._id;
    console.log('📛 전달된 queue ID:', queueId);

    if (!queueId || typeof queueId !== 'string' || queueId.length !== 24) {
      message.error('올바르지 않은 queue ID입니다.');
      return;
    }

    // 환자 정보 검증
    if (!queue.patientId || !queue.patientId.basicInfo || !queue.patientId.basicInfo.name) {
      message.error('환자 정보가 올바르지 않습니다.');
      return;
    }

    // 이미 호출된 환자인지 확인
    if (queue.status === 'called') {
      message.warning(`${queue.patientId.basicInfo.name}님은 이미 호출되었습니다.`);
      return;
    }

    try {
      setIsRefreshing(true);
      const response = await queueApi.callPatient(queueId);
      
      if (response?.data?.success || response?.status === 200) {
        const patientName = queue.patientId.basicInfo.name;
        message.success(`${patientName}님 호출 완료`);
        
        // 호출된 환자 정보 설정 (QueueDisplay에서 사용)
        setLastCalledPatient({
          _id: queueId,
          patientId: queue.patientId,
          status: 'called'
        });
        
        // WebSocket을 통해 진료실로 환자 데이터 전송
        wsClient.send({
          type: 'PATIENT_CALLED_TO_DOCTOR',
          patient: {
            _id: queue._id,
            patientId: queue.patientId,
            queueNumber: queue.queueNumber,
            status: 'called',
            symptoms: queue.symptoms || [],
            memo: queue.memo || '',
            stress: queue.stress || '',
            pulseAnalysis: queue.pulseAnalysis || '',
            registeredAt: queue.registeredAt,
            calledAt: new Date()
          }
        });
        
        // 음성 안내 실행 (지원되는 경우)
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          try {
            const { safeSpeak } = await import('../../utils/speechUtils');
            await safeSpeak(`${patientName}님 진료실로 들어오세요.`);
          } catch (speechError) {
            console.warn('음성 안내 실패:', speechError);
          }
        }
        
        // 실시간 데이터 새로고침
        refresh();
      } else {
        throw new Error(response?.data?.message || '호출 처리에 실패했습니다.');
      }
    } catch (error) {
      console.error('❌ callPatient 실패:', error.response?.data || error);
      
      // 구체적인 에러 메시지 표시
      let errorMessage = '환자 호출 실패';
      if (error.response?.status === 404) {
        errorMessage = '해당 환자를 찾을 수 없습니다.';
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data?.message || '잘못된 요청입니다.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      message.error(errorMessage);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleStatusChange = async (record, newStatus) => {
    try {
      console.log('🔄 상태 업데이트 시작:', { record, newStatus });
      
      // 이미 같은 상태인 경우 무시
      if (record.status === newStatus) {
        console.log('⚠️ 이미 같은 상태입니다:', newStatus);
        return;
      }

      const response = await queueApi.updateQueueStatus(record._id, newStatus);
      
      if (response?.success || response?.status === 'success') {
        console.log('✅ 상태 업데이트 성공');
        message.success(`상태가 "${newStatus}"로 변경되었습니다.`);

        // 로컬 상태 즉시 업데이트
        updateItem(record._id, { status: newStatus });

        // WebSocket 이벤트 전송
        wsClient.send({
          type: 'QUEUE_UPDATE',
          queueId: record._id,
          status: newStatus,
          timestamp: new Date().toISOString()
        });
      } else {
        throw new Error(response?.message || '상태 업데이트에 실패했습니다.');
      }
    } catch (error) {
      console.error('❌ 상태 업데이트 실패:', error);
      message.error('상태 업데이트에 실패했습니다.');
    }
  };

  const handleDelete = async (queueId) => {
    try {
      console.log('🗑️ 대기 삭제 시작:', queueId);
      await queueApi.deleteQueue(queueId);
      console.log('✅ 대기 삭제 성공');
      message.success('대기가 삭제되었습니다.');
      
      // 로컬 상태에서 즉시 제거
      removeItem(queueId);
    } catch (error) {
      console.error('❌ 대기 삭제 실패:', error);
      message.error('대기 삭제에 실패했습니다.');
    }
  };

  const getStatusActions = (record) => {
    const items = [
      {
        key: 'waiting',
        label: '대기중',
        disabled: record.status === 'waiting'
      },
      {
        key: 'called',
        label: '호출됨',
        disabled: record.status === 'called'
      },
      {
        key: 'consulting',
        label: '진료중',
        disabled: record.status === 'consulting'
      },
      {
        key: 'done',
        label: '완료',
        disabled: record.status === 'done'
      }
    ];

    return {
      items,
      onClick: ({ key }) => handleStatusChange(record, key)
    };
  };

  const getStatusStyle = (status) => {
    const styles = {
      waiting: { color: '#fa8c16', className: 'waiting' },
      called: { color: '#1890ff', className: 'called' },
      consulting: { color: '#52c41a', className: 'consulting' },
      completed: { color: '#8c8c8c', className: 'completed' }
    };
    return styles[status] || styles.waiting;
  };

  // 테이블 row 클래스 설정
  const getRowClassName = (record) => {
    return `${record.status}-row`;
  };

  // ✅ 테이블 컬럼 정의
  const columns = [
    {
      title: '순번',
      dataIndex: 'queueNumber',
      key: 'queueNumber',
      width: 80,
      align: 'center'
    },
    {
      title: '이름',
      key: 'name',
      width: 120,
      render: (_, record) => record.patientId?.basicInfo?.name || '-'
    },
    {
      title: '방문유형',
      key: 'visitType',
      width: 100,
      align: 'center',
      render: (_, record) => record.visitType === 'first' ? '초진' : '재진'
    },
    {
      title: '상태',
      key: 'status',
      width: 120,
      align: 'center',
      render: (_, record) => {
        const statusMap = {
          waiting: '대기 중',
          called: '호출됨',
          consulting: '진료 중',
          done: '완료',
          cancelled: '취소됨'
        };
        return statusMap[record.status] || record.status;
      }
    },
    {
      title: '접수시간',
      key: 'registeredAt',
      width: 150,
      render: (_, record) => {
        const date = new Date(record.registeredAt);
        return date.toLocaleString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    },
    {
      title: '작업',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          {record.status === 'waiting' && (
            <Button 
              type="primary" 
              size="small"
              onClick={() => handleCallPatient(record)}
            >
              호출
            </Button>
          )}
          <Select
            size="small"
            value={{ value: record.status, label: getStatusStyle(record.status).className }}
            style={{ width: 100 }}
            onChange={(value) => handleStatusChange(record, value.value)}
            labelInValue={true}
          >
            <Select.Option value="waiting" label="대기 중">대기 중</Select.Option>
            <Select.Option value="called" label="호출됨">호출됨</Select.Option>
            <Select.Option value="consulting" label="진료 중">진료 중</Select.Option>
            <Select.Option value="done" label="완료">완료</Select.Option>
            <Select.Option value="cancelled" label="취소">취소</Select.Option>
          </Select>
        </Space>
      )
    }
  ];

  // 환자 클릭 처리
  const handlePatientClick = (record) => {
    setSelectedPatient(record.patientId);
    setDetailVisible(true);
  };

  return (
    <DashboardContainer>
      {error && (
        <Alert message="오류" description={error} type="error" showIcon style={{ marginBottom: 16 }} />
      )}
      
      {/* 연결 상태 표시 */}
      {!isOnline && (
        <Alert 
          message="오프라인 모드" 
          description="인터넷 연결이 끊어졌습니다. 일부 기능이 제한될 수 있습니다." 
          type="warning" 
          showIcon 
          style={{ marginBottom: 16 }} 
        />
      )}
      
      <Spin spinning={loading} tip="불러오는 중...">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>접수실</h1>
            {lastUpdate && (
              <small style={{ color: '#8c8c8c' }}>
                마지막 업데이트: {lastUpdate.toLocaleTimeString()}
              </small>
            )}
          </div>
          <Button onClick={props.onClose || (() => navigate('/'))} type="default">
            홈으로
          </Button>
        </div>
        
        <SearchCard>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <Input.Search
              ref={searchInputRef}
              placeholder="환자명, 연락처로 검색"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ flex: 1, minWidth: '200px' }}
              allowClear
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: '150px' }}
              placeholder="상태 필터"
            >
              <Select.Option value="all">전체</Select.Option>
              <Select.Option value="waiting">대기중</Select.Option>
              <Select.Option value="called">호출됨</Select.Option>
              <Select.Option value="consulting">진료중</Select.Option>
              <Select.Option value="done">완료</Select.Option>
            </Select>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={isRefreshing}
            >
              새로고침
            </Button>
          </div>
        </SearchCard>

        <TableCard title="대기 관리">
          {/* 대기 현황 */}
          <div style={{ marginBottom: '1.5rem' }}>
            <WaitingList 
              queueList={queueList || []} 
              onQueueUpdate={refresh}
              loading={loading}
            />
          </div>
          
          {/* 대기열 화면 열기 버튼 */}
          <Button
            type="primary"
            size="large"
            onClick={() => setIsQueueDisplayVisible(true)}
            style={{ marginBottom: '1.5rem' }}
            block
          >
            대기열 화면 열기
          </Button>
          
          {/* 대기 목록 테이블 */}
          <Table 
            className="queue-table"
            columns={columns}
            dataSource={filteredData}
            rowKey="_id"
            loading={loading}
            rowClassName={(record) => `${record.status}-row`}
            pagination={{
              total: filteredData.length,
              pageSize: 10,
              showTotal: (total) => `총 ${total}개`,
              showSizeChanger: true,
              showQuickJumper: true
            }}
            scroll={{ y: 'calc(100vh - 400px)' }}
            size="middle"
          />
        </TableCard>

        <Drawer
          title="환자 상세 정보"
          placement="right"
          onClose={() => setDetailVisible(false)}
          open={detailVisible}
          width={600}
        >
          {selectedPatient && (
            <div className="drawer-content">
              <div className="detail-card">
                <div className="title">기본 정보</div>
                <div className="patient-info">
                  <div className="info-item">
                    <div className="label">이름</div>
                    <div className="value">{selectedPatient.basicInfo.name}</div>
                  </div>
                  <div className="info-item">
                    <div className="label">생년월일</div>
                    <div className="value">{selectedPatient.basicInfo.birthDate}</div>
                  </div>
                  <div className="info-item">
                    <div className="label">연락처</div>
                    <div className="value">{selectedPatient.basicInfo.phone}</div>
                  </div>
                </div>
              </div>
              <div className="detail-card">
                <div className="title">진료 정보</div>
                <Descriptions column={1}>
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
                  <Descriptions.Item label="방문 유형">{selectedPatient.basicInfo.visitType}</Descriptions.Item>
                </Descriptions>
              </div>
            </div>
          )}
        </Drawer>

        <QueueDisplay
          visible={isQueueDisplayVisible}
          onClose={() => setIsQueueDisplayVisible(false)}
          initialQueueList={queueList || []}
        />
      </Spin>
    </DashboardContainer>
  );
};

export default ReceptionDashboard; 