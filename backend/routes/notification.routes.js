const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { notificationValidation } = require('../validations');

// 알림 목록 조회
router.get(
  '/',
  authenticateToken,
  validate(notificationValidation.getNotifications),
  notificationController.getNotifications
);

// 읽지 않은 알림 수 조회
router.get(
  '/unread-count',
  authenticateToken,
  notificationController.getUnreadCount
);

// 알림 상세 조회
router.get(
  '/:id',
  authenticateToken,
  validate(notificationValidation.getNotification),
  notificationController.getNotification
);

// 알림 읽음 처리
router.patch(
  '/:id/read',
  authenticateToken,
  validate(notificationValidation.markAsRead),
  notificationController.markAsRead
);

// 모든 알림 읽음 처리
router.patch(
  '/mark-all-read',
  authenticateToken,
  notificationController.markAllAsRead
);

// 알림 삭제
router.delete(
  '/:id',
  authenticateToken,
  validate(notificationValidation.deleteNotification),
  notificationController.deleteNotification
);

// 알림 설정 조회
router.get(
  '/settings',
  authenticateToken,
  notificationController.getNotificationSettings
);

// 알림 설정 업데이트
router.patch(
  '/settings',
  authenticateToken,
  validate(notificationValidation.updateSettings),
  notificationController.updateNotificationSettings
);

// 알림 필터링
router.get(
  '/filter',
  authenticateToken,
  validate(notificationValidation.filterNotifications),
  notificationController.filterNotifications
);

// 알림 통계
router.get(
  '/stats',
  authenticateToken,
  validate(notificationValidation.getNotificationStats),
  notificationController.getNotificationStats
);

module.exports = router; 