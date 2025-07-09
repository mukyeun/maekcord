const Measurement = require('../models/measurement.model');
const Patient = require('../models/patient.model');
const logger = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');
const csv = require('csv-stringify');
const { promisify } = require('util');
const stringify = promisify(csv.stringify);

class DataService {
    // 측정 데이터 저장
    async saveMeasurement(data) {
        try {
            const measurement = new Measurement(data);
            await measurement.save();
            return measurement;
        } catch (error) {
            logger.error('측정 데이터 저장 실패:', error);
            throw error;
        }
    }

    // 측정 데이터 조회
    async getMeasurements(query = {}, options = {}) {
        try {
            const { page = 1, limit = 10, sort = '-measuredAt' } = options;
            const skip = (page - 1) * limit;

            const measurements = await Measurement.find(query)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .populate('patientId', 'patientId name');

            const total = await Measurement.countDocuments(query);

            return {
                measurements,
                pagination: {
                    total,
                    page: parseInt(page),
                    pages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            logger.error('측정 데이터 조회 실패:', error);
            throw error;
        }
    }

    // 환자별 측정 데이터 통계
    async getPatientStats(patientId) {
        try {
            const stats = await Measurement.getStatsByPatient(patientId);
            return stats[0] || null;
        } catch (error) {
            logger.error('환자 통계 조회 실패:', error);
            throw error;
        }
    }

    // 데이터 내보내기 (CSV)
    async exportData(query = {}, format = 'csv') {
        try {
            const measurements = await Measurement.find(query)
                .populate('patientId', 'patientId name')
                .lean();

            if (format === 'csv') {
                const data = measurements.map(m => ({
                    measurementId: m._id,
                    patientId: m.patientId?.patientId,
                    patientName: m.patientId?.name,
                    measuredAt: m.measuredAt,
                    heartRate: m.analysis.heartRate,
                    systolicPressure: m.analysis.systolicPressure,
                    diastolicPressure: m.analysis.diastolicPressure,
                    signalQuality: m.quality.signalQuality
                }));

                const csvString = await stringify(data, { header: true });
                const fileName = `measurements_${Date.now()}.csv`;
                const filePath = path.join(__dirname, '../../exports', fileName);

                await fs.writeFile(filePath, csvString);
                return { filePath, fileName };
            }

            throw new Error('지원하지 않는 내보내기 형식입니다.');
        } catch (error) {
            logger.error('데이터 내보내기 실패:', error);
            throw error;
        }
    }

    // 데이터 분석
    async analyzeMeasurement(measurementId) {
        try {
            const measurement = await Measurement.findById(measurementId);
            if (!measurement) {
                throw new Error('측정 데이터를 찾을 수 없습니다.');
            }

            // 여기에 맥파 분석 로직 구현
            // TODO: 실제 분석 알고리즘 적용

            measurement.status = 'analyzed';
            await measurement.save();

            return measurement;
        } catch (error) {
            logger.error('데이터 분석 실패:', error);
            throw error;
        }
    }

    // 데이터 검증
    async verifyMeasurement(measurementId, verificationData) {
        try {
            const measurement = await Measurement.findById(measurementId);
            if (!measurement) {
                throw new Error('측정 데이터를 찾을 수 없습니다.');
            }

            measurement.verification = verificationData;
            measurement.status = 'verified';
            await measurement.save();

            return measurement;
        } catch (error) {
            logger.error('데이터 검증 실패:', error);
            throw error;
        }
    }

    // 데이터 아카이브
    async archiveMeasurement(measurementId) {
        try {
            const measurement = await Measurement.findById(measurementId);
            if (!measurement) {
                throw new Error('측정 데이터를 찾을 수 없습니다.');
            }

            measurement.status = 'archived';
            await measurement.save();

            return measurement;
        } catch (error) {
            logger.error('데이터 아카이브 실패:', error);
            throw error;
        }
    }
}

module.exports = new DataService(); 