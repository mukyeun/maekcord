import { authAPI } from '../../api/auth';
import { loginStart, loginSuccess, loginFailure, logout } from '../slices/authSlice';

export const loginUser = (credentials) => async (dispatch) => {
  try {
    dispatch(loginStart());
    
    // 임시 로그인 로직 (API 연동 전까지 사용)
    await new Promise(resolve => setTimeout(resolve, 500)); // 실제 API 호출처럼 보이게 딜레이 추가
    
    const mockCredentials = {
      username: 'admin',
      password: 'admin123'
    };

    if (credentials.username === mockCredentials.username && 
        credentials.password === mockCredentials.password) {
      const mockUserData = {
        id: 1,
        username: 'admin',
        name: '관리자',
        role: 'doctor'
      };
      
      localStorage.setItem('token', 'mock-jwt-token');
      dispatch(loginSuccess(mockUserData));
      return mockUserData;
    } else {
      throw new Error('아이디 또는 비밀번호가 올바르지 않습니다.');
    }
  } catch (error) {
    dispatch(loginFailure(error.message));
    throw error;
  }
};

export const logoutUser = () => async (dispatch) => {
  try {
    await authAPI.logout();
    localStorage.removeItem('token');
    dispatch(logout());
  } catch (error) {
    console.error('Logout error:', error);
    // 에러가 발생하더라도 로컬의 로그아웃은 진행
    localStorage.removeItem('token');
    dispatch(logout());
  }
};

export const getCurrentUser = () => async (dispatch) => {
  try {
    dispatch(loginStart());
    const data = await authAPI.getCurrentUser();
    dispatch(loginSuccess(data));
    return data;
  } catch (error) {
    dispatch(loginFailure(error.response?.data?.message || '사용자 정보 조회 실패'));
    throw error;
  }
}; 