const dataService = require('../services/data.service');
const logger = require('../utils/logger');

class DataController {
    // 측정 데이터 저장
    async saveMeasurement(req, res) {
        try {
            const data = req.body;
            const measurement = await dataService.saveMeasurement(data);
            
            res.status(201).json({
                success: true,
                message: '측정 데이터가 저장되었습니다.',
                data: measurement
            });
        } catch (error) {
            logger.error('측정 데이터 저장 실패:', error);
            res.status(400).json({
                success: false,
                message: '측정 데이터 저장 중 오류가 발생했습니다.',
                error: error.message
            });
        }
    }

    // 측정 데이터 목록 조회
    async getMeasurements(req, res) {
        try {
            const { page, limit, sort, patientId, status } = req.query;
            const query = {};
            
            if (patientId) query.patientId = patientId;
            if (status) query.status = status;

            const result = await dataService.getMeasurements(query, { page, limit, sort });
            
            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error('측정 데이터 조회 실패:', error);
            res.status(500).json({
                success: false,
                message: '측정 데이터 조회 중 오류가 발생했습니다.',
                error: error.message
            });
        }
    }

    // 환자별 측정 통계 조회
    async getPatientStats(req, res) {
        try {
            const { patientId } = req.params;
            const stats = await dataService.getPatientStats(patientId);
            
            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            logger.error('환자 통계 조회 실패:', error);
            res.status(500).json({
                success: false,
                message: '환자 통계 조회 중 오류가 발생했습니다.',
                error: error.message
            });
        }
    }

    // 데이터 내보내기
    async exportData(req, res) {
        try {
            const { format, patientId, startDate, endDate } = req.query;
            const query = {};
            
            if (patientId) query.patientId = patientId;
            if (startDate || endDate) {
                query.measuredAt = {};
                if (startDate) query.measuredAt.$gte = new Date(startDate);
                if (endDate) query.measuredAt.$lte = new Date(endDate);
            }

            const result = await dataService.exportData(query, format);
            
            res.json({
                success: true,
                message: '데이터 내보내기가 완료되었습니다.',
                data: result
            });
        } catch (error) {
            logger.error('데이터 내보내기 실패:', error);
            res.status(500).json({
                success: false,
                message: '데이터 내보내기 중 오류가 발생했습니다.',
                error: error.message
            });
        }
    }

    // 데이터 분석
    async analyzeMeasurement(req, res) {
        try {
            const { measurementId } = req.params;
            const measurement = await dataService.analyzeMeasurement(measurementId);
            
            res.json({
                success: true,
                message: '데이터 분석이 완료되었습니다.',
                data: measurement
            });
        } catch (error) {
            logger.error('데이터 분석 실패:', error);
            res.status(500).json({
                success: false,
                message: '데이터 분석 중 오류가 발생했습니다.',
                error: error.message
            });
        }
    }

    // 데이터 검증
    async verifyMeasurement(req, res) {
        try {
            const { measurementId } = req.params;
            const verificationData = {
                verifiedBy: req.user._id,
                verifiedAt: new Date(),
                comments: req.body.comments
            };

            const measurement = await dataService.verifyMeasurement(measurementId, verificationData);
            
            res.json({
                success: true,
                message: '데이터 검증이 완료되었습니다.',
                data: measurement
            });
        } catch (error) {
            logger.error('데이터 검증 실패:', error);
            res.status(500).json({
                success: false,
                message: '데이터 검증 중 오류가 발생했습니다.',
                error: error.message
            });
        }
    }

    // 데이터 아카이브
    async archiveMeasurement(req, res) {
        try {
            const { measurementId } = req.params;
            const measurement = await dataService.archiveMeasurement(measurementId);
            
            res.json({
                success: true,
                message: '데이터가 아카이브되었습니다.',
                data: measurement
            });
        } catch (error) {
            logger.error('데이터 아카이브 실패:', error);
            res.status(500).json({
                success: false,
                message: '데이터 아카이브 중 오류가 발생했습니다.',
                error: error.message
            });
        }
    }
}

module.exports = new DataController(); 