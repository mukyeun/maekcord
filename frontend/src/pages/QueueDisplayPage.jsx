import React, { useState, useEffect, useCallback } from 'react';
import QueueDisplay from '../components/QueueDisplay/QueueDisplay';
import * as queueApi from '../api/queueApi';

const QueueDisplayPage = () => {
  const [queueList, setQueueList] = useState([]);
  const [visible, setVisible] = useState(true);

  // 대기열 목록 조회
  const fetchQueueList = useCallback(async () => {
    try {
      const response = await queueApi.getTodayQueueList();
      setQueueList(response.data || []);
    } catch (error) {
      console.error('대기열 목록 조회 실패:', error);
    }
  }, []);

  useEffect(() => {
    fetchQueueList();
    const interval = setInterval(fetchQueueList, 5000); // 5000ms = 5초
    return () => clearInterval(interval);
  }, [fetchQueueList]);

  const handleClose = () => {
    setVisible(false);
  };

  return (
    <div style={{ padding: 20 }}>
      <QueueDisplay
        visible={visible}
        onClose={handleClose}
        queueList={queueList}
      />
    </div>
  );
};

export default QueueDisplayPage; 