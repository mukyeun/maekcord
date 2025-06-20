/**
 * 주민등록번호에서 생년월일을 추출하는 함수
 * @param {string} residentNumber - 주민등록번호 (예: 620726-1122222)
 * @returns {string|null} YYYY-MM-DD 형식의 생년월일 또는 null
 */
export const extractBirthDate = (residentNumber) => {
  if (!residentNumber || typeof residentNumber !== 'string') {
    return null;
  }

  // 하이픈 제거 및 길이 검증
  const cleanNumber = residentNumber.replace(/-/g, '');
  if (cleanNumber.length < 7) {
    return null;
  }

  try {
    const year = cleanNumber.substring(0, 2);
    const month = cleanNumber.substring(2, 4);
    const day = cleanNumber.substring(4, 6);
    const genderDigit = cleanNumber.substring(6, 7);

    // 월/일 유효성 검사
    const monthNum = parseInt(month, 10);
    const dayNum = parseInt(day, 10);
    
    if (monthNum < 1 || monthNum > 12 || dayNum < 1 || dayNum > 31) {
      return null;
    }

    // ✅ 성별 코드에 따른 연도 설정 수정
    let fullYear;
    switch (genderDigit) {
      case '1': // 1900년대 남자
      case '2': // 1900년대 여자
        fullYear = `19${year}`;
        break;
      case '3': // 2000년대 남자
      case '4': // 2000년대 여자
        fullYear = `20${year}`;
        break;
      case '5': // 1900년대 외국인 남자
      case '6': // 1900년대 외국인 여자
        fullYear = `19${year}`;
        break;
      case '7': // 2000년대 외국인 남자
      case '8': // 2000년대 외국인 여자
        fullYear = `20${year}`;
        break;
      case '9': // 1800년대 남자
      case '0': // 1800년대 여자
        fullYear = `18${year}`;
        break;
      default:
        return null;
    }

    // 날짜 유효성 검사
    const birthDate = new Date(`${fullYear}-${month}-${day}`);
    if (isNaN(birthDate.getTime())) {
      return null;
    }

    // ✅ 현재 날짜와 비교
    const today = new Date();
    if (birthDate > today) {
      console.warn('유효하지 않은 생년월일:', birthDate);
      return null;
    }

    return `${fullYear}-${month}-${day}`;
  } catch (error) {
    console.error('생년월일 추출 중 오류:', error);
    return null;
  }
};

/**
 * 주민등록번호 유효성 검사
 * @param {string} residentNumber - 주민등록번호
 * @returns {boolean} 유효성 여부
 */
export const validateResidentNumber = (residentNumber) => {
  if (!residentNumber) return false;
  
  const clean = residentNumber.replace(/-/g, '');
  if (clean.length !== 13) return false;

  // ✅ 성별 코드 검증 추가
  const genderDigit = clean[6];
  if (!'1234567890'.includes(genderDigit)) {
    return false;
  }

  // 체크섬 검증
  const multipliers = [2,3,4,5,6,7,8,9,2,3,4,5];
  const checksum = clean
    .slice(0, 12)
    .split('')
    .reduce((sum, digit, index) => {
      return sum + (parseInt(digit) * multipliers[index]);
    }, 0);

  const checkDigit = (11 - (checksum % 11)) % 10;
  return parseInt(clean[12]) === checkDigit;
};

// ✅ 생년월일 유효성 검사 함수 추가
export const isValidBirthDate = (birthDate) => {
  if (!birthDate) return false;
  
  const date = new Date(birthDate);
  const today = new Date();
  
  return !isNaN(date.getTime()) && date <= today;
}; 