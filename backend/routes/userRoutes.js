const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');
const { USER_ROLES } = require('../config/constants');

// 미들웨어를 라우터에 등록
router.use(authenticateToken);

// 사용자 목록 조회 (관리자만)
router.get('/', authorizeRoles(USER_ROLES.ADMIN), userController.getUsers);

// 사용자 상세 조회
router.get('/:id', userController.getUser);

// 사용자 정보 수정
router.put('/:id', userController.updateUser);

// 사용자 삭제 (관리자만)
router.delete('/:id', authorizeRoles(USER_ROLES.ADMIN), userController.deleteUser);

// 인증이 필요하지 않은 라우트
router.post('/register', userController.register);
router.post('/login', userController.login);

// 인증이 필요한 라우트
router.get('/profile', userController.getProfile);  // 모든 인증된 사용자
router.patch('/profile', userController.updateProfile);  // 모든 인증된 사용자

module.exports = router;