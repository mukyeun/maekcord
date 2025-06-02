const validatePatient = (req, res, next) => {
  const { name, age, gender, phone } = req.body;

  // 필수 필드 검증
  if (!name || !age || !gender || !phone) {
    return res.status(400).json({
      success: false,
      message: '필수 필드가 누락되었습니다.',
      requiredFields: ['name', 'age', 'gender', 'phone']
    });
  }

  // 데이터 타입 검증
  if (typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: '이름이 유효하지 않습니다.'
    });
  }

  if (typeof age !== 'number' || age < 0 || age > 150) {
    return res.status(400).json({
      success: false,
      message: '나이가 유효하지 않습니다.'
    });
  }

  if (!['남', '여'].includes(gender)) {
    return res.status(400).json({
      success: false,
      message: '성별이 유효하지 않습니다.'
    });
  }

  if (!/^\d{3}-\d{4}-\d{4}$/.test(phone)) {
    return res.status(400).json({
      success: false,
      message: '전화번호 형식이 유효하지 않습니다. (예: 010-1234-5678)'
    });
  }

  next();
};

module.exports = validatePatient; 