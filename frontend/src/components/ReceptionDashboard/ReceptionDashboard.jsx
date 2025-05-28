import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Modal, Table, Tag, Button, Space, Drawer, Descriptions, message as antMessage, Dropdown, Input, Select, Alert, Spin } from 'antd';
import { UserOutlined, ReloadOutlined, BellOutlined, MoreOutlined, SearchOutlined, LoadingOutlined, EllipsisOutlined } from '@ant-design/icons';
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
import { speak } from '../../utils/speechUtils';

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

  const fetchQueueList = async () => {
    try {
      setLoading(true);
      console.log('📋 대기 목록 조회 시작');
      const data = await queueApi.getQueueList();
      console.log('✅ 대기 목록 조회 성공:', data);
      setQueueList(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('❌ 대기 목록 조회 실패:', error);
      antMessage.error('대기 목록을 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCall = async (record) => {
    try {
      console.log('📞 환자 호출 시작:', record._id);
      await queueApi.callPatient(record._id);
      console.log('✅ 환자 호출 성공');
      const patientName = record.patientId.basicInfo.name;
      const voiceMessage = `${patientName}님, 진료실로 와주세요`;
      await speak(voiceMessage);
      antMessage.success(`${patientName}님을 호출했습니다.`);
      fetchQueueList();
    } catch (error) {
      console.error('❌ 환자 호출 실패:', error);
      antMessage.error('환자 호출에 실패했습니다.');
    }
  };

  const handleStatusChange = async (record, newStatus) => {
    try {
      console.log('🔄 상태 업데이트 시작:', { record, newStatus });
      await queueApi.updateQueueStatus(record._id, newStatus);
      console.log('✅ 상태 업데이트 성공');
      antMessage.success(`상태가 "${newStatus}"로 변경되었습니다.`);
      fetchQueueList();
    } catch (error) {
      console.error('❌ 상태 업데이트 실패:', error);
      antMessage.error('상태 업데이트에 실패했습니다.');
    }
  };

  const handleDelete = async (queueId) => {
    try {
      console.log('🗑️ 대기 삭제 시작:', queueId);
      await queueApi.deleteQueue(queueId);
      console.log('✅ 대기 삭제 성공');
      antMessage.success('대기가 삭제되었습니다.');
      fetchQueueList();
    } catch (error) {
      console.error('❌ 대기 삭제 실패:', error);
      antMessage.error('대기 삭제에 실패했습니다.');
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

  useEffect(() => {
    const savedQueue = localStorage.getItem('queueList');
    if (savedQueue) {
      try {
        setQueueList(JSON.parse(savedQueue));
      } catch (err) {
        console.error('저장된 대기 목록 파싱 오류:', err);
        setQueueList([]);
      }
    }
    fetchQueueList();
  }, []);

  useEffect(() => {
    localStorage.setItem('queueList', JSON.stringify(queueList));
  }, [queueList]);

  useEffect(() => {
    fetchQueueList();
    const interval = setInterval(fetchQueueList, 30000); // 30초마다 자동 새로고침
    return () => clearInterval(interval);
  }, []);

  // 디바운스된 검색 함수
  const debouncedSearch = useCallback(
    debounce((value) => setSearchText(value), 300),
    []
  );

  // 메모이즈된 필터링 로직
  const filteredData = useMemo(() => {
    let result = [...queueList];
    
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

  // 테이블 컬럼 설정
  const columns = useMemo(() => [
    {
      title: '순번',
      dataIndex: 'queueNumber',
      key: 'queueNumber',
      width: 120,
    },
    {
      title: '이름',
      dataIndex: ['patientId', 'basicInfo', 'name'],
      key: 'name',
      width: 100,
    },
    {
      title: '방문유형',
      dataIndex: ['patientId', 'basicInfo', 'visitType'],
      key: 'visitType',
      width: 100,
      render: (text) => (
        <span className={`visit-type-badge ${text === '초진' ? 'first' : 'repeat'}`}>
          {text || '초진'}
        </span>
      )
    },
    {
      title: '상태',
      key: 'status',
      width: 100,
      render: (_, record) => (
        <span className={`status-badge ${record.status}`}>
          {record.status === 'waiting' && '대기중'}
          {record.status === 'called' && '호출됨'}
          {record.status === 'consulting' && '진료중'}
          {record.status === 'done' && '완료'}
        </span>
      )
    },
    {
      title: '작업',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          {record.status === 'waiting' && (
            <Button 
              type="primary"
              size="small"
              className="call-button"
              onClick={() => handleCall(record)}
              disabled={record.status === 'consulting'}
            >
              호출
            </Button>
          )}
          <Button 
            type="text"
            size="small"
            onClick={() => handlePatientClick(record)}
          >
            <EllipsisOutlined />
          </Button>
        </Space>
      ),
    }
  ], []);

  // 수동 새로고침
  const handleRefresh = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await fetchQueueList();
      antMessage.success('목록이 새로고침되었습니다.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // 자동 새로고침 (5분마다)
  useEffect(() => {
    const interval = setInterval(fetchQueueList, 300000);
    return () => clearInterval(interval);
  }, []);

  // WebSocket 연결 관리
  useEffect(() => {
    let reconnectTimer;
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 5;
    
    const handleConnectionError = () => {
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        antMessage.warning(`실시간 연결이 끊어졌습니다. 재연결 시도 ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`);
        reconnectTimer = setTimeout(() => {
          wsClient.connect();
        }, 3000);
      } else {
        antMessage.error('실시간 연결에 실패했습니다. 페이지를 새로고침해주세요.');
      }
    };

    wsClient.onError = handleConnectionError;
    wsClient.connect();
    
    return () => {
      clearTimeout(reconnectTimer);
      wsClient.disconnect();
    };
  }, []);

  // 환자 클릭 처리
  const handlePatientClick = (record) => {
    setSelectedPatient(record.patientId);
    setDetailVisible(true);
  };

  // WebSocket 이벤트 처리
  const handleWebSocketMessage = useCallback((data) => {
    switch (data.type) {
      case 'QUEUE_UPDATE':
        if (Array.isArray(data.queue)) {
          setQueueList(data.queue);
        }
        break;
      case 'PATIENT_CALLED':
        fetchQueueList();
        if (data.patient?.name) {
          antMessage.info(`${data.patient.name}님이 호출되었습니다.`);
        }
        break;
      default:
        console.log('처리되지 않은 WebSocket 메시지:', data);
    }
  }, []);

  return (
    <Modal
      title="접수실 대시보드"
      open={visible}
      onCancel={onClose}
      width="80%"
      style={{ top: 20 }}
      footer={null}
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
            {loading && <Spin size="small" style={{ marginLeft: 8 }} />}
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
                  <Descriptions.Item label="주요 증상">{selectedPatient.symptoms?.join(', ')}</Descriptions.Item>
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
      </div>
    </Modal>
  );
};

export default ReceptionDashboard; 