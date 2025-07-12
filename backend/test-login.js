const axios = require('axios');

async function testLogin() {
  try {
    console.log('🔍 로그인 테스트 시작...');
    
    const loginData = {
      email: 'admin@test.com',
      password: '123456'
    };
    
    console.log('📤 전송할 데이터:', loginData);
    
    const response = await axios.post('http://localhost:5000/api/auth/login', loginData);
    
    console.log('✅ 로그인 성공!');
    console.log('응답 데이터:', response.data);
    
  } catch (error) {
    console.log('❌ 로그인 실패');
    console.log('상태 코드:', error.response?.status);
    console.log('에러 메시지:', error.response?.data);
    console.log('전체 에러:', error.message);
  }
}

testLogin(); 