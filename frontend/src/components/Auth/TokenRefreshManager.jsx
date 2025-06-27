import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { message } from 'antd';
import axiosInstance from '../../api/axiosInstance';

const TokenRefreshManager = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector(state => state.auth);
  const refreshTimeoutRef = useRef(null);
  const sessionTimeoutRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  // 사용자 활동 감지
  const updateLastActivity = () => {
    lastActivityRef.current = Date.now();
  };

  // 토큰 갱신 함수
  const refreshToken = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('토큰이 없습니다.');
      }

      const response = await axiosInstance.post('/api/auth/refresh', {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        const newToken = response.data.data.token;
        localStorage.setItem('token', newToken);
        
        // axios 인스턴스의 기본 헤더 업데이트
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        
        console.log('✅ 토큰이 성공적으로 갱신되었습니다.');
        
        // 다음 갱신 예약 (23시간 후)
        scheduleTokenRefresh();
      }
    } catch (error) {
      console.error('❌ 토큰 갱신 실패:', error);
      handleLogout('토큰 갱신에 실패했습니다. 다시 로그인해주세요.');
    }
  };

  // 토큰 갱신 예약
  const scheduleTokenRefresh = () => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    // 23시간 후 토큰 갱신 (24시간 만료 전에 갱신)
    const refreshTime = 23 * 60 * 60 * 1000; // 23시간
    refreshTimeoutRef.current = setTimeout(refreshToken, refreshTime);
  };

  // 세션 타임아웃 체크
  const checkSessionTimeout = () => {
    const now = Date.now();
    const lastActivity = lastActivityRef.current;
    const sessionTimeout = 8 * 60 * 60 * 1000; // 8시간 (의료진 기준)

    if (now - lastActivity > sessionTimeout) {
      handleLogout('장시간 활동이 없어 자동 로그아웃되었습니다.');
    }
  };

  // 로그아웃 처리
  const handleLogout = (reason = '로그아웃되었습니다.') => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
    }

    // 이벤트 리스너 제거
    document.removeEventListener('mousedown', updateLastActivity);
    document.removeEventListener('keydown', updateLastActivity);
    document.removeEventListener('touchstart', updateLastActivity);

    dispatch(logout());
    message.warning(reason);
  };

  // 세션 모니터링 시작
  const startSessionMonitoring = () => {
    // 사용자 활동 감지 이벤트 리스너
    document.addEventListener('mousedown', updateLastActivity);
    document.addEventListener('keydown', updateLastActivity);
    document.addEventListener('touchstart', updateLastActivity);

    // 1분마다 세션 타임아웃 체크
    sessionTimeoutRef.current = setInterval(checkSessionTimeout, 60 * 1000);

    // 토큰 갱신 예약
    scheduleTokenRefresh();
  };

  // 세션 모니터링 중지
  const stopSessionMonitoring = () => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
    }

    document.removeEventListener('mousedown', updateLastActivity);
    document.removeEventListener('keydown', updateLastActivity);
    document.removeEventListener('touchstart', updateLastActivity);
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('🔐 인증된 사용자 감지, 세션 모니터링 시작');
      startSessionMonitoring();
    } else {
      console.log('🔓 인증되지 않은 사용자, 세션 모니터링 중지');
      stopSessionMonitoring();
    }

    return () => {
      stopSessionMonitoring();
    };
  }, [isAuthenticated, user]);

  // 페이지 언로드 시 경고
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isAuthenticated) {
        e.preventDefault();
        e.returnValue = '작업 중인 내용이 있습니다. 정말 나가시겠습니까?';
        return e.returnValue;
      }
    };

    if (isAuthenticated) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isAuthenticated]);

  return null; // 이 컴포넌트는 UI를 렌더링하지 않음
};

export default TokenRefreshManager;
