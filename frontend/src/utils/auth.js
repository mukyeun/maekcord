// 로컬 스토리지 키
const TOKEN_KEY = 'maekcode_token';
const REFRESH_TOKEN_KEY = 'maekcode_refresh_token';
const USER_KEY = 'maekcode_user';

// 토큰 관리
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const removeToken = () => localStorage.removeItem(TOKEN_KEY);

export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);
export const setRefreshToken = (token) => localStorage.setItem(REFRESH_TOKEN_KEY, token);
export const removeRefreshToken = () => localStorage.removeItem(REFRESH_TOKEN_KEY);

// 사용자 정보 관리
export const getUser = () => {
  const userStr = localStorage.getItem(USER_KEY);
  return userStr ? JSON.parse(userStr) : null;
};

export const setUser = (user) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const removeUser = () => {
  localStorage.removeItem(USER_KEY);
};

// 인증 상태 확인
export const isAuthenticated = () => {
  const token = getToken();
  const user = getUser();
  return !!token && !!user;
};

// 로그아웃
export const logout = () => {
  removeToken();
  removeRefreshToken();
  removeUser();
};

// 토큰 갱신이 필요한지 확인
export const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch (error) {
    return true;
  }
};

// 권한 확인
export const hasRole = (requiredRole) => {
  const user = getUser();
  return user && user.roles && user.roles.includes(requiredRole);
};

// 헤더 생성
export const getAuthHeader = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// WebSocket 인증 토큰 생성
export const getWebSocketToken = () => {
  const token = getToken();
  const user = getUser();
  
  if (!token || !user) return null;
  
  return {
    token,
    userId: user._id
  };
};

export default {
  getToken,
  setToken,
  removeToken,
  getRefreshToken,
  setRefreshToken,
  removeRefreshToken,
  getUser,
  setUser,
  removeUser,
  isAuthenticated,
  logout,
  isTokenExpired,
  hasRole,
  getAuthHeader,
  getWebSocketToken
}; 