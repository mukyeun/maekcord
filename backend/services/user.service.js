const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const config = require('../config/auth.config');
const logger = require('../utils/logger');

class UserService {
    // 사용자 생성
    async createUser(userData) {
        try {
            const user = new User(userData);
            await user.save();
            return user;
        } catch (error) {
            logger.error('사용자 생성 실패:', error);
            throw error;
        }
    }

    // 사용자 목록 조회
    async getUsers(query = {}, options = {}) {
        try {
            const { page = 1, limit = 10, sort = '-createdAt' } = options;
            const skip = (page - 1) * limit;

            const users = await User.find(query)
                .sort(sort)
                .skip(skip)
                .limit(limit);

            const total = await User.countDocuments(query);

            return {
                users,
                pagination: {
                    total,
                    page: parseInt(page),
                    pages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            logger.error('사용자 목록 조회 실패:', error);
            throw error;
        }
    }

    // 사용자 상세 조회
    async getUserById(userId) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('사용자를 찾을 수 없습니다.');
            }
            return user;
        } catch (error) {
            logger.error('사용자 조회 실패:', error);
            throw error;
        }
    }

    // 사용자 정보 수정
    async updateUser(userId, updateData) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('사용자를 찾을 수 없습니다.');
            }

            // 비밀번호 변경 시 별도 처리
            if (updateData.password) {
                user.password = updateData.password;
            }

            Object.assign(user, updateData);
            await user.save();

            return user;
        } catch (error) {
            logger.error('사용자 정보 수정 실패:', error);
            throw error;
        }
    }

    // 사용자 삭제
    async deleteUser(userId) {
        try {
            const user = await User.findByIdAndDelete(userId);
            if (!user) {
                throw new Error('사용자를 찾을 수 없습니다.');
            }
            return user;
        } catch (error) {
            logger.error('사용자 삭제 실패:', error);
            throw error;
        }
    }

    // 사용자 상태 변경
    async updateUserStatus(userId, status) {
        try {
            const user = await User.findByIdAndUpdate(
                userId,
                { status },
                { new: true }
            );
            if (!user) {
                throw new Error('사용자를 찾을 수 없습니다.');
            }
            return user;
        } catch (error) {
            logger.error('사용자 상태 변경 실패:', error);
            throw error;
        }
    }

    // 로그인 처리
    async login(email, password) {
        try {
            const user = await User.findOne({ email });
            if (!user) {
                throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.');
            }

            const isValidPassword = await user.comparePassword(password);
            if (!isValidPassword) {
                throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.');
            }

            if (user.status !== 'active') {
                throw new Error('비활성화된 계정입니다.');
            }

            // 마지막 로그인 시간 업데이트
            user.lastLogin = new Date();
            await user.save();

            // JWT 토큰 생성
            const token = jwt.sign(
                {
                    _id: user._id,
                    email: user.email,
                    role: user.role
                },
                config.jwtSecret,
                {
                    expiresIn: '24h',
                    issuer: 'maekstation'
                }
            );

            return {
                token,
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                }
            };
        } catch (error) {
            logger.error('로그인 실패:', error);
            throw error;
        }
    }
}

module.exports = new UserService(); 