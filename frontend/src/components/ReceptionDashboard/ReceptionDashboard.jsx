import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Modal, Table, Tag, Button, Space, Drawer, Descriptions, message, Dropdown, Input, Select, Alert, Spin, Empty } from 'antd';
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

const DashboardContainer = styled.div`
  padding: 24px;
`;

const { Search } = Input;
const { Option } = Select;

const ReceptionDashboard = ({ visible, onClose }) => {
  const [queueList, setQueueList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [isQueueDisplayVisible, setIsQueueDisplayVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastCalledPatient, setLastCalledPatient] = useState(null);

  // 실시간 업데이트를 위한 폴링 간격 (ms)
  const POLLING_INTERVAL = 300000; // 5분

  const fetchQueueList = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('📋 대기 목록 조회 시작');
      
      const response = await queueApi.getTodayQueueList();
      console.log('🔍 서버 응답:', response);
      
      if (response?.data && Array.isArray(response.data)) {
        console.log('✅ 대기 목록 데이터 처리:', response.data);
        setQueueList(response.data);
      } else if (Array.isArray(response)) {
        console.log('✅ 대기 목록 데이터 처리 (배열):', response);
        setQueueList(response);
      } else {
        console.error('❌ 대기 목록 데이터 형식 오류:', response);
        message.error('대기 목록을 불러오는 데 실패했습니다.');
        setQueueList([]);
      }
    } catch (error) {
      console.error('❌ 대기 목록 조회 실패:', error);
      setError(error.message);
      message.error('대기 목록을 불러오는 데 실패했습니다.');
      setQueueList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCallPatient = async (queue) => {
    const queueId = queue?._id;
    console.log('📛 전달된 queue ID:', queueId);

    if (!queueId || typeof queueId !== 'string' || queueId.length !== 24) {
      message.error('올바르지 않은 queue ID입니다.');
      return;
    }

    try {
      setLoading(true);
      const response = await queueApi.callPatient(queueId);
      
      if (response?.data?.success || response?.status === 200) {
        const patientName = queue.patientId?.basicInfo?.name || '환자';
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
        
        // 대기 목록 새로고침
        await fetchQueueList();
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
        errorMessage = '잘못된 요청입니다.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      message.error(errorMessage);
    } finally {
      setLoading(false);
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

        // WebSocket 이벤트 전송
        wsClient.send({
          type: 'QUEUE_UPDATE',
          queueId: record._id,
          status: newStatus,
          timestamp: new Date().toISOString()
        });
        
        // 대기 목록 새로고침
        await fetchQueueList();
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
      fetchQueueList();
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

  // 로컬 스토리지에서 초기 데이터 로드 - 컴포넌트 마운트 시 한 번만 실행
  useEffect(() => {
    try {
      const savedQueue = localStorage.getItem('queueList');
      if (savedQueue) {
        const parsedQueue = JSON.parse(savedQueue);
        if (Array.isArray(parsedQueue)) {
          setQueueList(parsedQueue);
        }
      }
    } catch (err) {
      console.error('저장된 대기 목록 파싱 오류:', err);
      // 잘못된 데이터 제거
      localStorage.removeItem('queueList');
    }
    fetchQueueList().then((list) => {
      if (Array.isArray(list) && list.length > 0) {
        console.log('🔍 queueList 샘플 확인:', list[0]);
      }
    });
  }, []);

  // 큐 목록이 변경될 때 로컬 스토리지 업데이트 - 디바운스 적용
  const debouncedSaveToLocalStorage = useCallback(
    debounce((queue) => {
      try {
        localStorage.setItem('queueList', JSON.stringify(queue));
      } catch (err) {
        console.error('대기 목록 저장 오류:', err);
      }
    }, 1000),
    []
  );

  useEffect(() => {
    debouncedSaveToLocalStorage(queueList);
  }, [queueList]);

  // 단일 폴링 설정
  useEffect(() => {
    if (!visible) return; // 대시보드가 보이지 않을 때는 폴링 중지

    console.log('🔄 폴링 시작 - 간격:', POLLING_INTERVAL);
    const interval = setInterval(fetchQueueList, POLLING_INTERVAL);
    
    return () => {
      console.log('🛑 폴링 중지');
      clearInterval(interval);
    };
  }, [visible]);

  // 디바운스된 검색 함수
  const debouncedSearch = useCallback(
    debounce((value) => setSearchText(value), 300),
    []
  );

  // 메모이즈된 필터링 로직
  const filteredData = useMemo(() => {
    // queueList가 undefined나 null이면 빈 배열 사용
    let result = Array.isArray(queueList) ? [...queueList] : [];
    
    if (statusFilter !== 'all') {
      result = result.filter(item => item.status === statusFilter);
    }
    
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      result = result.filter(item => 
        item.patientId?.basicInfo?.name?.toLowerCase().includes(searchLower) ||
        item.queueNumber?.toString().includes(searchLower) ||
        item.patientId?.basicInfo?.phone?.includes(searchText)
      );
    }
    
    return result;
  }, [queueList, searchText, statusFilter]);

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

  // 수동 새로고침
  const handleRefresh = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await fetchQueueList();
      message.success('목록이 새로고침되었습니다.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // WebSocket 이벤트 처리 최적화
  const handleWebSocketMessage = useCallback((data) => {
    console.log('📨 ReceptionDashboard - WebSocket 메시지 수신:', data);
    
    switch (data?.type) {
      case 'QUEUE_UPDATE':
        if (Array.isArray(data?.queue)) {
          console.log('📋 큐 목록 업데이트:', data.queue);
          setQueueList(data.queue);
        } else {
          console.warn('⚠️ 유효하지 않은 큐 데이터:', data.queue);
          fetchQueueList(); // 유효하지 않은 데이터 수신 시 서버에서 다시 조회
        }
        break;
      case 'PATIENT_CALLED': {
        console.log('📞 환자 호출 이벤트:', data);
        const name = data?.patient?.basicInfo?.name || '환자';
        
        // 음성 안내 실행
        announcePatientCall(name);
        
        // 큐 데이터가 포함된 경우 fetchQueueList 호출 없이 직접 업데이트
        if (Array.isArray(data?.queue)) {
          setQueueList(data.queue);
        } else {
          fetchQueueList(); // 큐 데이터가 없거나 유효하지 않은 경우 서버에서 다시 조회
        }
        break;
      }
      case 'CONNECTED':
      case 'pong':
      case 'PONG':
        // 연결 확인 및 ping-pong 메시지 - 무시
        break;
      default:
        console.log('⚠️ 처리되지 않은 WebSocket 메시지:', data);
    }
  }, []); // fetchQueueList 의존성 제거

  // WebSocket 연결 관리
  useEffect(() => {
    let isComponentMounted = true;

    const setupWebSocket = () => {
      if (!isComponentMounted) return;

      console.log('🔄 ReceptionDashboard - WebSocket 연결 설정');
      wsClient.connect();
      return wsClient.addListener(handleWebSocketMessage);
    };

    const removeListener = setupWebSocket();

    return () => {
      console.log('🔌 ReceptionDashboard - WebSocket 정리');
      isComponentMounted = false;
      if (removeListener) removeListener();
    };
  }, [handleWebSocketMessage]);

  // 환자 클릭 처리
  const handlePatientClick = (record) => {
    setSelectedPatient(record.patientId);
    setDetailVisible(true);
  };

  // ✅ 로딩 상태 표시
  if (loading && queueList.length === 0) {
    return <Spin tip="대기 목록을 불러오는 중...">
      <div className="content" />
    </Spin>;
  }

  // ✅ 에러 상태 표시
  if (error) {
    return (
      <Alert
        message="데이터 로드 실패"
        description={error}
        type="error"
        showIcon
      />
    );
  }

  // ✅ 테스트 함수 추가
  const handleTest = async () => {
    try {
      setLoading(true);
      const response = await queueApi.testQueueList();
      console.log('테스트 결과:', response);
      message.info(`전체 데이터 수: ${response.count}개`);
    } catch (error) {
      console.error('테스트 실패:', error);
      message.error('테스트 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTestData = async () => {
    try {
      setLoading(true);
      const response = await queueApi.createTestData();
      message.success(`테스트 데이터 ${response.testData.length}개 생성됨`);
      fetchQueueList(); // 목록 새로고침
    } catch (error) {
      console.error('테스트 데이터 생성 실패:', error);
      message.error('테스트 데이터 생성 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleDebug = async () => {
    try {
      setLoading(true);
      const response = await queueApi.getDebugInfo();
      console.log('디버깅 정보:', response);
      
      Modal.info({
        title: '데이터베이스 디버깅 정보',
        width: 800,
        content: (
          <div style={{ maxHeight: '60vh', overflow: 'auto' }}>
            <pre>{JSON.stringify(response.debug, null, 2)}</pre>
          </div>
        )
      });
    } catch (error) {
      console.error('디버깅 실패:', error);
      message.error('디버깅 정보 조회 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="접수실 대시보드"
      open={visible}
      onCancel={onClose}
      width="80%"
      style={{ top: 20 }}
      footer={null}
      styles={{
        body: { maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }
      }}
    >
      <div className="dashboard-wrapper">
        {error && (
          <Alert
            message="오류"
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
            closable
            onClose={() => setError(null)}
          />
        )}
        <Space style={{ marginBottom: 16 }} size="middle">
          <Button 
            type="primary"
            onClick={() => setIsQueueDisplayVisible(true)}
          >
            대기 현황판
          </Button>
          
          <Search
            placeholder="이름/번호/연락처 검색"
            allowClear
            style={{ width: 200 }}
            onChange={e => debouncedSearch(e.target.value)}
          />
          
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 120 }}
          >
            <Option value="all">전체 상태</Option>
            <Option value="waiting">대기중</Option>
            <Option value="called">호출됨</Option>
            <Option value="consulting">진료중</Option>
            <Option value="done">완료</Option>
          </Select>

          <Button
            icon={isRefreshing ? <LoadingOutlined /> : <ReloadOutlined />}
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="refresh-button"
          >
            새로고침
          </Button>

          <span>
            총 {filteredData.length}명
            {loading && <Spin size="small" style={{ marginLeft: 8 }}>
              <div className="content" />
            </Spin>}
          </span>
        </Space>

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
          scroll={{ y: 'calc(100vh - 300px)' }}
          size="middle"
        />

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
          initialQueueList={queueList}
        />

        <WaitingList 
          queueList={queueList}
          onQueueUpdate={fetchQueueList}
          loading={loading}
        />
      </div>
    </Modal>
  );
};

export default ReceptionDashboard; 