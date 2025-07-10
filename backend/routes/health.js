const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const logger = require('../utils/logger');

// 헬스 체크 엔드포인트
router.get('/', async (req, res) => {
  try {
    // 데이터베이스 연결 상태 확인
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // 메모리 사용량 확인
    const memUsage = process.memoryUsage();
    
    // 업타임 확인
    const uptime = process.uptime();
    
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`,
      database: dbStatus,
      memory: {
        rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`
      },
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0'
    };

    logger.info('🔍 헬스 체크 요청:', healthStatus);
    
    res.json({
      success: true,
      data: healthStatus
    });
  } catch (error) {
    logger.error('❌ 헬스 체크 실패:', error);
    res.status(500).json({
      success: false,
      message: '서버 상태 확인 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 상세 상태 확인
router.get('/detailed', async (req, res) => {
  try {
    const detailedStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      system: {
        platform: process.platform,
        nodeVersion: process.version,
        pid: process.pid,
        uptime: process.uptime()
      },
      database: {
        status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        name: mongoose.connection.name
      },
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development'
    };

    res.json({
      success: true,
      data: detailedStatus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '상세 상태 확인 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

module.exports = router; 