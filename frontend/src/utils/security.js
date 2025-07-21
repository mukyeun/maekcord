import DOMPurify from 'dompurify';

/**
 * XSS 방지를 위한 HTML 정제
 * @param {string} html - 정제할 HTML 문자열
 * @returns {string} 정제된 HTML
 */
export const sanitizeHTML = (html) => {
  if (!html) return '';
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br', 'p', 'div', 'span'],
    ALLOWED_ATTR: ['href', 'target', 'class', 'id']
  });
};

/**
 * 입력값 검증 및 정제
 * @param {string} input - 검증할 입력값
 * @param {string} type - 입력 타입 (text, email, phone, number)
 * @returns {string} 정제된 입력값
 */
export const validateAndSanitizeInput = (input, type = 'text') => {
  if (!input || typeof input !== 'string') return '';

  let sanitized = input.trim();

  switch (type) {
    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(sanitized)) {
        throw new Error('유효하지 않은 이메일 형식입니다.');
      }
      break;
    
    case 'phone':
      const phoneRegex = /^[0-9-+\s()]{10,15}$/;
      if (!phoneRegex.test(sanitized)) {
        throw new Error('유효하지 않은 전화번호 형식입니다.');
      }
      break;
    
    case 'number':
      if (isNaN(sanitized) || sanitized === '') {
        throw new Error('숫자만 입력 가능합니다.');
      }
      break;
    
    case 'text':
    default:
      // 특수문자 제한 (의료 데이터 보안)
      const textRegex = /^[a-zA-Z0-9가-힣\s\-_.,!?()]+$/;
      if (!textRegex.test(sanitized)) {
        throw new Error('허용되지 않는 특수문자가 포함되어 있습니다.');
      }
      break;
  }

  return sanitized;
};

/**
 * 토큰 유효성 검사
 * @param {string} token - 검사할 JWT 토큰
 * @returns {boolean} 토큰 유효성
 */
export const isTokenValid = (token) => {
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    
    return payload.exp > currentTime;
  } catch (error) {
    console.error('토큰 검증 실패:', error);
    return false;
  }
};

/**
 * 토큰에서 사용자 정보 추출
 * @param {string} token - JWT 토큰
 * @returns {Object|null} 사용자 정보
 */
export const extractUserFromToken = (token) => {
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      exp: payload.exp
    };
  } catch (error) {
    console.error('토큰에서 사용자 정보 추출 실패:', error);
    return null;
  }
};

/**
 * 민감한 데이터 마스킹
 * @param {string} data - 마스킹할 데이터
 * @param {string} type - 데이터 타입 (phone, email, name)
 * @returns {string} 마스킹된 데이터
 */
export const maskSensitiveData = (data, type = 'phone') => {
  if (!data) return '';

  switch (type) {
    case 'phone':
      return data.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
    
    case 'email':
      const [local, domain] = data.split('@');
      const maskedLocal = local.length > 2 
        ? local.substring(0, 2) + '*'.repeat(local.length - 2)
        : local;
      return `${maskedLocal}@${domain}`;
    
    case 'name':
      if (data.length <= 2) return data;
      return data.substring(0, 1) + '*'.repeat(data.length - 1);
    
    default:
      return data;
  }
};

/**
 * 세션 보안 검사
 * @returns {Object} 보안 상태
 */
export const checkSessionSecurity = () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  const securityStatus = {
    hasValidToken: false,
    hasUserData: false,
    isSecure: false,
    warnings: []
  };

  // 토큰 검증
  if (token && isTokenValid(token)) {
    securityStatus.hasValidToken = true;
  } else {
    securityStatus.warnings.push('유효하지 않은 토큰');
  }

  // 사용자 데이터 검증
  if (user) {
    try {
      const userData = JSON.parse(user);
      if (userData.id && userData.role) {
        securityStatus.hasUserData = true;
      } else {
        securityStatus.warnings.push('불완전한 사용자 데이터');
      }
    } catch (error) {
      securityStatus.warnings.push('손상된 사용자 데이터');
    }
  } else {
    securityStatus.warnings.push('사용자 데이터 없음');
  }

  // HTTPS 검증
  if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
    securityStatus.warnings.push('HTTPS 연결이 아닙니다');
  }

  securityStatus.isSecure = securityStatus.hasValidToken && 
                           securityStatus.hasUserData && 
                           securityStatus.warnings.length === 0;

  return securityStatus;
};

/**
 * 로그아웃 시 보안 정리
 */
export const secureLogout = () => {
  // 로컬 스토리지 정리
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  // 세션 스토리지 정리
  sessionStorage.clear();
  
  // 쿠키 정리
  document.cookie.split(";").forEach((c) => {
    document.cookie = c
      .replace(/^ +/, "")
      .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
  });
  
  // 브라우저 캐시 정리 (선택적)
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => {
        caches.delete(name);
      });
    });
  }
  
  console.log('🔒 보안 정리 완료');
};

/**
 * API 요청 보안 헤더 생성
 * @returns {Object} 보안 헤더
 */
export const getSecurityHeaders = () => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}; 