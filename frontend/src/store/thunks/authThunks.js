import { login as loginApi } from '../../api/authApi';
import { loginStart, loginSuccess, loginFailure, logout } from '../slices/authSlice';

export const loginUser = (credentials) => async (dispatch) => {
  try {
    dispatch(loginStart());
    
    // 실제 API 호출 - authApi의 login 함수 사용
    const response = await loginApi(credentials.email || credentials.username, credentials.password);

    if (response.success) {
      localStorage.setItem('token', response.data.token);
      dispatch(loginSuccess(response.data.user));
      return response.data.user;
    } else {
      throw new Error(response.message || '로그인에 실패했습니다.');
    }
  } catch (error) {
    dispatch(loginFailure(error.message));
    throw error;
  }
};

export const logoutUser = () => async (dispatch) => {
  try {
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