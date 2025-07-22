const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../middlewares/auth');
const { logger, systemMonitor, performanceLogger } = require('../../utils/logger');
const os = require('os');
const mongoose = require('mongoose');

/**
 * @swagger
 * tags:
 *   name: Monitoring
 *   description: 시스템 모니터링 API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     SystemStatus:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: [healthy, warning, critical]
 *           description: 시스템 상태
 *         uptime:
 *           type: number
 *           description: 서버 가동 시간 (초)
 *         memory:
 *           type: object
 *           properties:
 *             total:
 *               type: number
 *               description: 전체 메모리 (MB)
 *             used:
 *               type: number
 *               description: 사용 중인 메모리 (MB)
 *             free:
 *               type: number
 *               description: 사용 가능한 메모리 (MB)
 *             percentage:
 *               type: number
 *               description: 메모리 사용률 (%)
 *         cpu:
 *           type: object
 *           properties:
 *             loadAverage:
 *               type: array
 *               items:
 *                 type: number
 *               description: CPU 로드 평균
 *             cores:
 *               type: number
 *               description: CPU 코어 수
 *         database:
 *           type: object
 *           properties:
 *             status:
 *               type: string
 *               enum: [connected, disconnected, error]
 *               description: 데이터베이스 연결 상태
 *             collections:
 *               type: number
 *               description: 컬렉션 수
 *             documents:
 *               type: number
 *               description: 총 문서 수
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: 상태 조회 시간
 */

/**
 * @swagger
 * /api/v1/monitoring/status:
 *   get:
 *     summary: 시스템 상태 조회
 *     description: 현재 시스템의 상태 정보를 조회합니다.
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 시스템 상태 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SystemStatus'
 *       401:
 *         description: 인증 실패
 *       500:
 *         description: 서버 오류
 */
router.get('/status', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const startTime = Date.now();
    
    // 메모리 사용량
    const memUsage = process.memoryUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memPercentage = (usedMem / totalMem) * 100;
    
    // CPU 정보
    const cpuLoad = os.loadavg();
    const cpuCores = os.cpus().length;
    
    // 데이터베이스 상태
    let dbStatus = 'disconnected';
    let collections = 0;
    let documents = 0;
    
    try {
      if (mongoose.connection.readyState === 1) {
        dbStatus = 'connected';
        const collectionsList = await mongoose.connection.db.listCollections().toArray();
        collections = collectionsList.length;
        
        // 각 컬렉션의 문서 수 계산
        for (const collection of collectionsList) {
          const count = await mongoose.connection.db.collection(collection.name).countDocuments();
          documents += count;
        }
      }
    } catch (dbError) {
      logger.error('데이터베이스 상태 확인 실패:', dbError);
      dbStatus = 'error';
    }
    
    // 시스템 상태 판단
    let systemStatus = 'healthy';
    if (memPercentage > 90 || cpuLoad[0] > cpuCores * 2) {
      systemStatus = 'critical';
    } else if (memPercentage > 80 || cpuLoad[0] > cpuCores) {
      systemStatus = 'warning';
    }
    
    const statusData = {
      status: systemStatus,
      uptime: process.uptime(),
      memory: {
        total: Math.round(totalMem / 1024 / 1024),
        used: Math.round(usedMem / 1024 / 1024),
        free: Math.round(freeMem / 1024 / 1024),
        percentage: Math.round(memPercentage * 100) / 100
      },
      cpu: {
        loadAverage: cpuLoad,
        cores: cpuCores
      },
      database: {
        status: dbStatus,
        collections,
        documents
      },
      timestamp: new Date().toISOString()
    };
    
    const duration = Date.now() - startTime;
    performanceLogger.logApiCall('GET', '/api/v1/monitoring/status', duration, 200, req.user?.id);
    
    res.json({
      success: true,
      data: statusData,
      message: '시스템 상태 조회 성공'
    });
    
  } catch (error) {
    logger.error('❌ 시스템 상태 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '시스템 상태 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/monitoring/metrics:
 *   get:
 *     summary: 성능 메트릭 조회
 *     description: 시스템 성능 메트릭을 조회합니다.
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [1h, 6h, 24h, 7d]
 *           default: 1h
 *         description: 조회 기간
 *     responses:
 *       200:
 *         description: 성능 메트릭 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     apiCalls:
 *                       type: array
 *                       items:
 *                         type: object
 *                     databaseQueries:
 *                       type: array
 *                       items:
 *                         type: object
 *                     errorRates:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         description: 인증 실패
 *       500:
 *         description: 서버 오류
 */
router.get('/metrics', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { period = '1h' } = req.query;
    
    // 실제 구현에서는 시계열 데이터베이스나 로그 분석을 통해 메트릭을 수집
    // 여기서는 예시 데이터를 반환
    const metrics = {
      apiCalls: [
        { timestamp: new Date(Date.now() - 3600000).toISOString(), count: 150, avgResponseTime: 120 },
        { timestamp: new Date(Date.now() - 1800000).toISOString(), count: 200, avgResponseTime: 95 },
        { timestamp: new Date().toISOString(), count: 180, avgResponseTime: 110 }
      ],
      databaseQueries: [
        { timestamp: new Date(Date.now() - 3600000).toISOString(), count: 300, avgDuration: 15 },
        { timestamp: new Date(Date.now() - 1800000).toISOString(), count: 450, avgDuration: 12 },
        { timestamp: new Date().toISOString(), count: 380, avgDuration: 18 }
      ],
      errorRates: [
        { timestamp: new Date(Date.now() - 3600000).toISOString(), errors: 2, total: 150, rate: 1.33 },
        { timestamp: new Date(Date.now() - 1800000).toISOString(), errors: 1, total: 200, rate: 0.5 },
        { timestamp: new Date().toISOString(), count: 180, avgResponseTime: 110 }
      ]
    };
    
    res.json({
      success: true,
      data: metrics,
      message: '성능 메트릭 조회 성공'
    });
    
  } catch (error) {
    logger.error('❌ 성능 메트릭 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '성능 메트릭 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/monitoring/logs:
 *   get:
 *     summary: 로그 조회
 *     description: 시스템 로그를 조회합니다.
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [error, warn, info, debug]
 *         description: 로그 레벨 필터
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           maximum: 1000
 *         description: 조회할 로그 수
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: 시작 날짜
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: 종료 날짜
 *     responses:
 *       200:
 *         description: 로그 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                       level:
 *                         type: string
 *                       message:
 *                         type: string
 *                       metadata:
 *                         type: object
 *       401:
 *         description: 인증 실패
 *       500:
 *         description: 서버 오류
 */
router.get('/logs', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { level, limit = 50, startDate, endDate } = req.query;
    
    // 실제 구현에서는 로그 파일이나 데이터베이스에서 로그를 조회
    // 여기서는 예시 데이터를 반환
    const logs = [
      {
        timestamp: new Date(Date.now() - 60000).toISOString(),
        level: 'info',
        message: 'API 요청 처리 완료',
        metadata: { method: 'GET', path: '/api/v1/patients', duration: 120 }
      },
      {
        timestamp: new Date(Date.now() - 120000).toISOString(),
        level: 'warn',
        message: '데이터베이스 쿼리 시간 초과',
        metadata: { collection: 'patients', duration: 5000 }
      },
      {
        timestamp: new Date(Date.now() - 180000).toISOString(),
        level: 'error',
        message: '인증 토큰 검증 실패',
        metadata: { userId: 'anonymous', ip: '192.168.1.100' }
      }
    ];
    
    // 필터링 (실제 구현에서는 데이터베이스 쿼리로 처리)
    let filteredLogs = logs;
    
    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level);
    }
    
    if (startDate) {
      const start = new Date(startDate);
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= start);
    }
    
    if (endDate) {
      const end = new Date(endDate);
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= end);
    }
    
    // 제한
    filteredLogs = filteredLogs.slice(0, Math.min(parseInt(limit), 1000));
    
    res.json({
      success: true,
      data: filteredLogs,
      message: '로그 조회 성공'
    });
    
  } catch (error) {
    logger.error('❌ 로그 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '로그 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/monitoring/alerts:
 *   get:
 *     summary: 알림 조회
 *     description: 시스템 알림을 조회합니다.
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 알림 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       type:
 *                         type: string
 *                         enum: [error, warning, info]
 *                       message:
 *                         type: string
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                       resolved:
 *                         type: boolean
 *       401:
 *         description: 인증 실패
 *       500:
 *         description: 서버 오류
 */
router.get('/alerts', authenticate, authorize(['admin']), async (req, res) => {
  try {
    // 실제 구현에서는 알림 데이터베이스에서 조회
    const alerts = [
      {
        id: 'alert-001',
        type: 'warning',
        message: '메모리 사용률이 80%를 초과했습니다.',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        resolved: false
      },
      {
        id: 'alert-002',
        type: 'error',
        message: '데이터베이스 연결이 불안정합니다.',
        timestamp: new Date(Date.now() - 600000).toISOString(),
        resolved: true
      }
    ];
    
    res.json({
      success: true,
      data: alerts,
      message: '알림 조회 성공'
    });
    
  } catch (error) {
    logger.error('❌ 알림 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '알림 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

module.exports = router; 