const express = require('express');
const router = express.Router();
const backupManager = require('../scripts/backup');
const { authenticate, authorize } = require('../middlewares/auth');
const { logger } = require('../utils/logger');

/**
 * @swagger
 * tags:
 *   name: Backup
 *   description: 데이터베이스 백업 관리 API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     BackupInfo:
 *       type: object
 *       properties:
 *         fileName:
 *           type: string
 *           description: 백업 파일명
 *         fileSize:
 *           type: string
 *           description: 파일 크기
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: 생성일시
 *         path:
 *           type: string
 *           description: 파일 경로
 *     BackupStatus:
 *       type: object
 *       properties:
 *         hasBackup:
 *           type: boolean
 *           description: 백업 존재 여부
 *         lastBackup:
 *           $ref: '#/components/schemas/BackupInfo'
 *         totalBackups:
 *           type: integer
 *           description: 전체 백업 수
 *         daysSinceLastBackup:
 *           type: integer
 *           description: 마지막 백업으로부터 경과일
 *         isRecent:
 *           type: boolean
 *           description: 최근 백업 여부
 */

/**
 * @swagger
 * /api/backup/status:
 *   get:
 *     summary: 백업 상태 조회
 *     description: 현재 백업 상태와 최근 백업 정보를 조회합니다.
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 백업 상태 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/BackupStatus'
 *       401:
 *         description: 인증 실패
 *       500:
 *         description: 서버 오류
 */
router.get('/status', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const status = backupManager.getBackupStatus();
    
    res.json({
      success: true,
      data: status,
      message: '백업 상태 조회 성공'
    });
  } catch (error) {
    logger.error('❌ 백업 상태 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '백업 상태 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/backup/list:
 *   get:
 *     summary: 백업 목록 조회
 *     description: 모든 백업 파일 목록을 조회합니다.
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 백업 목록 조회 성공
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
 *                     $ref: '#/components/schemas/BackupInfo'
 *       401:
 *         description: 인증 실패
 *       500:
 *         description: 서버 오류
 */
router.get('/list', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const backupList = backupManager.getBackupList();
    
    res.json({
      success: true,
      data: backupList,
      message: '백업 목록 조회 성공'
    });
  } catch (error) {
    logger.error('❌ 백업 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '백업 목록 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/backup/create:
 *   post:
 *     summary: 수동 백업 생성
 *     description: 수동으로 데이터베이스 백업을 생성합니다.
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 백업 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/BackupInfo'
 *                 message:
 *                   type: string
 *                   example: 백업이 성공적으로 생성되었습니다.
 *       401:
 *         description: 인증 실패
 *       500:
 *         description: 서버 오류
 */
router.post('/create', authenticate, authorize(['admin']), async (req, res) => {
  try {
    logger.info('🔄 수동 백업 요청됨');
    
    const result = await backupManager.createBackup();
    
    res.json({
      success: true,
      data: result,
      message: '백업이 성공적으로 생성되었습니다.'
    });
  } catch (error) {
    logger.error('❌ 수동 백업 실패:', error);
    res.status(500).json({
      success: false,
      message: '백업 생성 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/backup/restore:
 *   post:
 *     summary: 백업 복구
 *     description: 지정된 백업 파일로 데이터베이스를 복구합니다.
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fileName
 *             properties:
 *               fileName:
 *                 type: string
 *                 description: 복구할 백업 파일명
 *     responses:
 *       200:
 *         description: 복구 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 데이터베이스 복구가 완료되었습니다.
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 실패
 *       500:
 *         description: 서버 오류
 */
router.post('/restore', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { fileName } = req.body;
    
    if (!fileName) {
      return res.status(400).json({
        success: false,
        message: '백업 파일명이 필요합니다.'
      });
    }
    
    logger.info('🔄 백업 복구 요청됨', { fileName });
    
    const result = await backupManager.restoreBackup(fileName);
    
    res.json({
      success: true,
      data: result,
      message: '데이터베이스 복구가 완료되었습니다.'
    });
  } catch (error) {
    logger.error('❌ 백업 복구 실패:', error);
    res.status(500).json({
      success: false,
      message: '백업 복구 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/backup/test:
 *   post:
 *     summary: 백업 테스트
 *     description: 백업 기능을 테스트합니다. (테스트 후 백업 파일은 자동 삭제)
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 테스트 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 백업 테스트가 성공했습니다.
 *       401:
 *         description: 인증 실패
 *       500:
 *         description: 서버 오류
 */
router.post('/test', authenticate, authorize(['admin']), async (req, res) => {
  try {
    logger.info('🧪 백업 테스트 요청됨');
    
    const result = await backupManager.testBackup();
    
    res.json({
      success: true,
      data: result,
      message: '백업 테스트가 성공했습니다.'
    });
  } catch (error) {
    logger.error('❌ 백업 테스트 실패:', error);
    res.status(500).json({
      success: false,
      message: '백업 테스트 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/backup/download/{fileName}:
 *   get:
 *     summary: 백업 파일 다운로드
 *     description: 지정된 백업 파일을 다운로드합니다.
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileName
 *         required: true
 *         schema:
 *           type: string
 *         description: 다운로드할 백업 파일명
 *     responses:
 *       200:
 *         description: 파일 다운로드 성공
 *         content:
 *           application/gzip:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 실패
 *       404:
 *         description: 파일을 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
router.get('/download/:fileName', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { fileName } = req.params;
    
    if (!fileName || !fileName.endsWith('.gz')) {
      return res.status(400).json({
        success: false,
        message: '유효한 백업 파일명이 필요합니다.'
      });
    }
    
    const backupList = backupManager.getBackupList();
    const backupFile = backupList.find(file => file.fileName === fileName);
    
    if (!backupFile) {
      return res.status(404).json({
        success: false,
        message: '백업 파일을 찾을 수 없습니다.'
      });
    }
    
    res.download(backupFile.path, fileName, (err) => {
      if (err) {
        logger.error('❌ 백업 파일 다운로드 실패:', err);
        res.status(500).json({
          success: false,
          message: '파일 다운로드 중 오류가 발생했습니다.'
        });
      }
    });
    
  } catch (error) {
    logger.error('❌ 백업 파일 다운로드 실패:', error);
    res.status(500).json({
      success: false,
      message: '파일 다운로드 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

module.exports = router; 