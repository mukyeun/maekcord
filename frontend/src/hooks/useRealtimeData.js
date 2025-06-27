import { useState, useEffect, useCallback, useRef } from 'react';
import { wsClient } from '../utils/websocket';
import { message } from 'antd';

/**
 * 실시간 데이터 동기화를 위한 커스텀 훅
 * @param {string} dataType - 데이터 타입 (예: 'queue', 'patient', 'pulse')
 * @param {Function} fetchFunction - 데이터를 가져오는 함수
 * @param {Object} options - 옵션 설정
 * @returns {Object} 실시간 데이터 상태 및 함수들
 */
const useRealtimeData = (dataType, fetchFunction, options = {}) => {
  const {
    autoConnect = true,
    pollingInterval = 300000, // 5분
    enablePolling = true,
    enableWebSocket = true,
    onDataUpdate = null,
    onError = null,
    retryAttempts = 3,
    retryDelay = 1000
  } = options;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [retryCount, setRetryCount] = useState(0);
  
  const pollingRef = useRef(null);
  const wsListenerRef = useRef(null);
  const mountedRef = useRef(true);
  const retryTimeoutRef = useRef(null);

  // 온라인/오프라인 상태 감지
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      message.success('인터넷 연결이 복구되었습니다.');
      if (autoConnect) {
        fetchData();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      message.warning('인터넷 연결이 끊어졌습니다. 오프라인 모드로 전환됩니다.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [autoConnect]);

  // 데이터 가져오기 함수 - 의존성 최적화
  const fetchData = useCallback(async (isRetry = false) => {
    if (!mountedRef.current) return;

    console.log(`🔄 ${dataType} 데이터 요청 시작 (재시도: ${isRetry})`);

    try {
      setLoading(true);
      setError(null);
      
      const result = await fetchFunction();
      
      console.log(`✅ ${dataType} 데이터 요청 성공:`, result);
      
      if (mountedRef.current) {
        setData(Array.isArray(result) ? result : result?.data || []);
        setLastUpdate(new Date());
        setRetryCount(0);
        
        if (onDataUpdate) {
          onDataUpdate(result);
        }
      }
    } catch (err) {
      console.error(`❌ ${dataType} 데이터 조회 실패:`, err);
      
      if (mountedRef.current) {
        setError(err.message || '데이터를 불러오는데 실패했습니다.');
        
        if (onError) {
          onError(err);
        }

        // 재시도 로직 - ref를 사용하여 의존성 문제 해결
        if (!isRetry && retryCount < retryAttempts) {
          setRetryCount(prev => prev + 1);
          const currentRetryCount = retryCount;
          console.log(`🔄 ${dataType} 재시도 ${currentRetryCount + 1}/${retryAttempts}`);
          retryTimeoutRef.current = setTimeout(() => {
            fetchData(true);
          }, retryDelay * Math.pow(2, currentRetryCount));
        }
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [dataType, fetchFunction, onDataUpdate, onError, retryAttempts, retryDelay]); // retryCount 제거

  // WebSocket 메시지 처리 - fetchData 의존성 제거
  const handleWebSocketMessage = useCallback((wsData) => {
    if (!mountedRef.current) return;

    // 데이터 타입에 따른 메시지 필터링
    if (wsData.type === `${dataType.toUpperCase()}_UPDATE` || 
        wsData.type === `${dataType.toUpperCase()}_CREATE` ||
        wsData.type === `${dataType.toUpperCase()}_DELETE`) {
      
      console.log(`📨 ${dataType} 실시간 업데이트 수신:`, wsData);
      
      // 즉시 데이터 새로고침
      fetchData();
      
      // 사용자에게 알림
      if (wsData.type.includes('CREATE')) {
        message.success('새로운 데이터가 추가되었습니다.');
      } else if (wsData.type.includes('UPDATE')) {
        message.info('데이터가 업데이트되었습니다.');
      } else if (wsData.type.includes('DELETE')) {
        message.warning('데이터가 삭제되었습니다.');
      }
    }
  }, [dataType, fetchData]);

  // WebSocket 연결 설정
  useEffect(() => {
    if (!enableWebSocket || !mountedRef.current) return;

    // WebSocket 리스너 등록
    wsListenerRef.current = wsClient.addListener(handleWebSocketMessage);

    // 연결 상태 리스너
    const statusListener = wsClient.addStatusListener((status) => {
      if (status === 'connected' && autoConnect) {
        fetchData();
      }
    });

    return () => {
      if (wsListenerRef.current) {
        wsListenerRef.current();
      }
      if (statusListener) {
        statusListener();
      }
    };
  }, [enableWebSocket, handleWebSocketMessage, autoConnect, fetchData]);

  // 폴링 설정 - fetchData 의존성 제거
  useEffect(() => {
    if (!enablePolling || !mountedRef.current) return;

    console.log(`🔄 ${dataType} 폴링 시작 (간격: ${pollingInterval}ms)`);

    const startPolling = () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
      
      pollingRef.current = setInterval(() => {
        // WebSocket이 연결되어 있으면 폴링 건너뛰기
        if (isOnline && !wsClient.isConnected()) {
          console.log(`🔄 ${dataType} 폴링 실행 (WebSocket 연결 없음)`);
          fetchData();
        } else {
          console.log(`⏭️ ${dataType} 폴링 건너뛰기 (WebSocket 연결됨 또는 오프라인)`);
        }
      }, pollingInterval);
    };

    startPolling();

    return () => {
      if (pollingRef.current) {
        console.log(`🛑 ${dataType} 폴링 중지`);
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [enablePolling, pollingInterval, isOnline, fetchData]);

  // 초기 데이터 로드
  useEffect(() => {
    if (autoConnect && mountedRef.current) {
      fetchData();
    }
  }, [autoConnect, fetchData]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // 수동 새로고침
  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // 데이터 업데이트
  const updateData = useCallback((newData) => {
    if (mountedRef.current) {
      setData(newData);
      setLastUpdate(new Date());
    }
  }, []);

  // 특정 항목 업데이트
  const updateItem = useCallback((id, updates) => {
    if (mountedRef.current) {
      setData(prevData => 
        prevData.map(item => 
          item._id === id || item.id === id ? { ...item, ...updates } : item
        )
      );
      setLastUpdate(new Date());
    }
  }, []);

  // 특정 항목 삭제
  const removeItem = useCallback((id) => {
    if (mountedRef.current) {
      setData(prevData => 
        prevData.filter(item => item._id !== id && item.id !== id)
      );
      setLastUpdate(new Date());
    }
  }, []);

  // 특정 항목 추가
  const addItem = useCallback((newItem) => {
    if (mountedRef.current) {
      setData(prevData => [...prevData, newItem]);
      setLastUpdate(new Date());
    }
  }, []);

  return {
    data,
    loading,
    error,
    lastUpdate,
    isOnline,
    retryCount,
    refresh,
    updateData,
    updateItem,
    removeItem,
    addItem,
    connectionStatus: wsClient.getConnectionStatus(),
    isConnected: wsClient.isConnected()
  };
};

export default useRealtimeData; 