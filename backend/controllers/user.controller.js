const userService = require('../services/user.service');
const logger = require('../utils/logger');

class UserController {
    // 사용자 목록 조회
    async getUsers(req, res) {
        try {
            const { page, limit, sort, role, status } = req.query;
            const query = {};
            
            if (role) query.role = role;
            if (status) query.status = status;

            const result = await userService.getUsers(query, { page, limit, sort });
            
            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error('사용자 목록 조회 실패:', error);
            res.status(500).json({
                success: false,
                message: '사용자 목록을 조회하는 중 오류가 발생했습니다.',
                error: error.message
            });
        }
    }

    // 사용자 상세 조회
    async getUser(req, res) {
        try {
            const { userId } = req.params;
            const user = await userService.getUserById(userId);
            
            res.json({
                success: true,
                data: user
            });
        } catch (error) {
            logger.error('사용자 조회 실패:', error);
            res.status(404).json({
                success: false,
                message: '사용자를 찾을 수 없습니다.',
                error: error.message
            });
        }
    }

    // 사용자 생성
    async createUser(req, res) {
        try {
            const userData = req.body;
            const user = await userService.createUser(userData);
            
            res.status(201).json({
                success: true,
                message: '사용자가 생성되었습니다.',
                data: user
            });
        } catch (error) {
            logger.error('사용자 생성 실패:', error);
            res.status(400).json({
                success: false,
                message: '사용자 생성 중 오류가 발생했습니다.',
                error: error.message
            });
        }
    }

    // 사용자 정보 수정
    async updateUser(req, res) {
        try {
            const { userId } = req.params;
            const updateData = req.body;
            
            const user = await userService.updateUser(userId, updateData);
            
            res.json({
                success: true,
                message: '사용자 정보가 수정되었습니다.',
                data: user
            });
        } catch (error) {
            logger.error('사용자 정보 수정 실패:', error);
            res.status(400).json({
                success: false,
                message: '사용자 정보 수정 중 오류가 발생했습니다.',
                error: error.message
            });
        }
    }

    // 사용자 삭제
    async deleteUser(req, res) {
        try {
            const { userId } = req.params;
            await userService.deleteUser(userId);
            
            res.json({
                success: true,
                message: '사용자가 삭제되었습니다.'
            });
        } catch (error) {
            logger.error('사용자 삭제 실패:', error);
            res.status(400).json({
                success: false,
                message: '사용자 삭제 중 오류가 발생했습니다.',
                error: error.message
            });
        }
    }

    // 사용자 상태 변경
    async updateUserStatus(req, res) {
        try {
            const { userId } = req.params;
            const { status } = req.body;
            
            const user = await userService.updateUserStatus(userId, status);
            
            res.json({
                success: true,
                message: '사용자 상태가 변경되었습니다.',
                data: user
            });
        } catch (error) {
            logger.error('사용자 상태 변경 실패:', error);
            res.status(400).json({
                success: false,
                message: '사용자 상태 변경 중 오류가 발생했습니다.',
                error: error.message
            });
        }
    }

    // 로그인
    async login(req, res) {
        try {
            const { email, password } = req.body;
            const result = await userService.login(email, password);
            
            res.json({
                success: true,
                message: '로그인되었습니다.',
                data: result
            });
        } catch (error) {
            logger.error('로그인 실패:', error);
            res.status(401).json({
                success: false,
                message: '로그인에 실패했습니다.',
                error: error.message
            });
        }
    }
}

module.exports = new UserController(); 