const monitoringService = require('../services/monitoring.service');
const logger = require('../utils/logger');

class MonitoringController {
    // 전체 시스템 상태 조회
    async getSystemStatus(req, res) {
        try {
            const status = await monitoringService.getSystemStatus();
            res.json({
                success: true,
                data: status
            });
        } catch (error) {
            logger.error('시스템 상태 조회 실패:', error);
            res.status(500).json({
                success: false,
                message: '시스템 상태 조회 중 오류가 발생했습니다.',
                error: error.message
            });
        }
    }

    // 메모리 사용량 조회
    async getMemoryUsage(req, res) {
        try {
            const memory = await monitoringService.getMemoryUsage();
            res.json({
                success: true,
                data: memory
            });
        } catch (error) {
            logger.error('메모리 사용량 조회 실패:', error);
            res.status(500).json({
                success: false,
                message: '메모리 사용량 조회 중 오류가 발생했습니다.',
                error: error.message
            });
        }
    }

    // CPU 사용량 조회
    async getCpuUsage(req, res) {
        try {
            const cpu = await monitoringService.getCpuUsage();
            res.json({
                success: true,
                data: cpu
            });
        } catch (error) {
            logger.error('CPU 사용량 조회 실패:', error);
            res.status(500).json({
                success: false,
                message: 'CPU 사용량 조회 중 오류가 발생했습니다.',
                error: error.message
            });
        }
    }

    // MongoDB 상태 조회
    async getMongoDBStatus(req, res) {
        try {
            const mongodb = await monitoringService.getMongoDBStatus();
            res.json({
                success: true,
                data: mongodb
            });
        } catch (error) {
            logger.error('MongoDB 상태 조회 실패:', error);
            res.status(500).json({
                success: false,
                message: 'MongoDB 상태 조회 중 오류가 발생했습니다.',
                error: error.message
            });
        }
    }

    // 애플리케이션 상태 조회
    async getApplicationStatus(req, res) {
        try {
            const app = await monitoringService.getApplicationStatus();
            res.json({
                success: true,
                data: app
            });
        } catch (error) {
            logger.error('애플리케이션 상태 조회 실패:', error);
            res.status(500).json({
                success: false,
                message: '애플리케이션 상태 조회 중 오류가 발생했습니다.',
                error: error.message
            });
        }
    }
}

module.exports = new MonitoringController(); 