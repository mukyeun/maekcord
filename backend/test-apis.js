const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testAPIs() {
  console.log('🧪 API 테스트 시작...\n');
  
  try {
    // 1. 서버 상태 확인
    console.log('1️⃣ 서버 상태 확인');
    try {
      const response = await axios.get(`${BASE_URL}/health`);
      console.log('✅ 서버 정상 동작');
    } catch (error) {
      console.log('⚠️ 서버 상태 확인 API 없음 (정상)');
    }
    
    // 2. 로그인 API 테스트
    console.log('\n2️⃣ 로그인 API 테스트');
    try {
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'admin@test.com',
        password: '123456'
      });
      console.log('✅ 로그인 성공');
      console.log(`   - 토큰: ${loginResponse.data.token ? '존재함' : '없음'}`);
      console.log(`   - 사용자: ${loginResponse.data.user?.name || 'N/A'}`);
      
      const token = loginResponse.data.token;
      
      // 3. 대기열 조회 API 테스트
      console.log('\n3️⃣ 대기열 조회 API 테스트');
      try {
        const queueResponse = await axios.get(`${BASE_URL}/queues`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ 대기열 조회 성공');
        console.log(`   - 대기열 수: ${queueResponse.data.length || 0}개`);
      } catch (error) {
        console.log('❌ 대기열 조회 실패:', error.response?.data?.message || error.message);
      }
      
      // 4. 환자 목록 조회 API 테스트
      console.log('\n4️⃣ 환자 목록 조회 API 테스트');
      try {
        const patientsResponse = await axios.get(`${BASE_URL}/patients`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ 환자 목록 조회 성공');
        console.log(`   - 환자 수: ${patientsResponse.data.length || 0}명`);
      } catch (error) {
        console.log('❌ 환자 목록 조회 실패:', error.response?.data?.message || error.message);
      }
      
      // 5. 진료 기록 조회 API 테스트
      console.log('\n5️⃣ 진료 기록 조회 API 테스트');
      try {
        const recordsResponse = await axios.get(`${BASE_URL}/patients/records`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ 진료 기록 조회 성공');
        console.log(`   - 기록 수: ${recordsResponse.data.length || 0}개`);
      } catch (error) {
        console.log('❌ 진료 기록 조회 실패:', error.response?.data?.message || error.message);
      }
      
    } catch (error) {
      console.log('❌ 로그인 실패:', error.response?.data?.message || error.message);
    }
    
    // 6. 잘못된 로그인 테스트
    console.log('\n6️⃣ 잘못된 로그인 테스트');
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        email: 'wrong@test.com',
        password: 'wrongpassword'
      });
      console.log('❌ 잘못된 로그인이 성공했음 (비정상)');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ 잘못된 로그인 적절히 거부됨');
      } else {
        console.log('⚠️ 예상과 다른 응답:', error.response?.status);
      }
    }
    
  } catch (error) {
    console.error('❌ API 테스트 중 오류 발생:', error.message);
  }
  
  console.log('\n🏁 API 테스트 완료!');
}

testAPIs(); 