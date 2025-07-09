const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { isAdmin, isAuthenticated } = require('../middleware/auth');

// 공개 라우트
router.post('/login', userController.login);

// 인증 필요 라우트
router.get('/profile', isAuthenticated, userController.getUser);
router.put('/profile', isAuthenticated, userController.updateUser);

// 관리자 전용 라우트
router.get('/', isAdmin, userController.getUsers);
router.post('/', isAdmin, userController.createUser);
router.get('/:userId', isAdmin, userController.getUser);
router.put('/:userId', isAdmin, userController.updateUser);
router.delete('/:userId', isAdmin, userController.deleteUser);
router.patch('/:userId/status', isAdmin, userController.updateUserStatus);

module.exports = router; 