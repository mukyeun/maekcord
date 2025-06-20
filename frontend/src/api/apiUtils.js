// API 응답 처리 유틸리티

// 성공 응답 처리
export const handleResponse = (response) => {
  if (response.data) {
    return response.data;
  }
  return response;
};

// 에러 응답 처리
export const handleError = (error) => {
  console.error('API Error:', error);
  
  if (error.response) {
    // 서버가 응답을 반환한 경우
    return {
      success: false,
      message: error.response.data.message || '서버 오류가 발생했습니다.',
      error: error.response.data
    };
  } else if (error.request) {
    // 요청은 보냈지만 응답을 받지 못한 경우
    return {
      success: false,
      message: '서버에 연결할 수 없습니다.',
      error: error.request
    };
  } else {
    // 요청 설정 중 오류가 발생한 경우
    return {
      success: false,
      message: '요청 중 오류가 발생했습니다.',
      error: error.message
    };
  }
}; 