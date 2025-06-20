import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { login } from '../../api/authApi';

// Mock login API
const mockLoginAPI = async (credentials) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  if (credentials.username === 'admin' && credentials.password === '1234') {
    const userData = {
      id: 1,
      username: 'admin',
      name: '관리자',
      role: 'admin'
    };
    // 로그인 성공 시 로컬 스토리지에 저장
    localStorage.setItem('token', 'mock-jwt-token');
    localStorage.setItem('user', JSON.stringify(userData));
    
    return {
      user: userData,
      token: 'mock-jwt-token'
    };
  }
  throw new Error('아이디 또는 비밀번호가 올바르지 않습니다.');
};

// Async thunk action
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const { token, user } = await login(credentials.email, credentials.password);
      
      if (!token) {
        return rejectWithValue('서버에서 토큰을 받지 못했습니다.');
      }

      // 토큰과 사용자 정보를 localStorage에 저장
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      return { user, token }; // token도 반환하여 fullfilled에서 사용 가능
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || '로그인 실패');
    }
  }
);

const initialState = {
  isAuthenticated: Boolean(localStorage.getItem('token')),
  user: (() => {
    try {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing user data from localStorage:', error);
      localStorage.removeItem('user'); // 잘못된 데이터 제거
      return null;
    }
  })(),
  loading: false,
  error: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.loading = false;
      state.error = null;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.loading = false;
      state.error = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.loading = false;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isAuthenticated = false;
        state.user = null;
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer; 