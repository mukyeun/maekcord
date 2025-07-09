const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth');

// 미들웨어 등록
router.use(authMiddleware);

// 의사 목록 조회
router.get('/', async (req, res) => {
  try {
    // 개발 환경에서는 더미 데이터 반환
    const doctors = [
      { id: 1, name: '김의사', specialization: '내과' },
      { id: 2, name: '이의사', specialization: '외과' },
      { id: 3, name: '박의사', specialization: '소아과' }
    ];
    
    res.json({ success: true, data: doctors });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ success: false, message: '의사 목록을 불러오는데 실패했습니다.' });
  }
});

module.exports = router; 