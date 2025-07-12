const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authMiddleware } = require('../middlewares/auth');
const { validate } = require('../middlewares/validation');
const { notificationValidation } = require('../validations');

// 알림 목록 조회
router.get(
  '/',
  authMiddleware,
  validate(notificationValidation.getNotifications),
  notificationController.getNotifications
);

// 읽지 않은 알림 수 조회
router.get(
  '/unread-count',
  authMiddleware,
  notificationController.getUnreadCount
);

// 알림 상세 조회
router.get(
  '/:id',
  authMiddleware,
  validate(notificationValidation.getNotification),
  notificationController.getNotification
);

// 알림 읽음 처리
router.patch(
  '/:id/read',
  authMiddleware,
  validate(notificationValidation.markAsRead),
  notificationController.markAsRead
);

// 모든 알림 읽음 처리
router.patch(
  '/mark-all-read',
  authMiddleware,
  notificationController.markAllAsRead
);

// 알림 삭제
router.delete(
  '/:id',
  authMiddleware,
  validate(notificationValidation.deleteNotification),
  notificationController.deleteNotification
);

// 알림 설정 조회
router.get(
  '/settings',
  authMiddleware,
  notificationController.getNotificationSettings
);

// 알림 설정 업데이트
router.patch(
  '/settings',
  authMiddleware,
  validate(notificationValidation.updateSettings),
  notificationController.updateNotificationSettings
);

// 알림 필터링
router.get(
  '/filter',
  authMiddleware,
  validate(notificationValidation.filterNotifications),
  notificationController.filterNotifications
);

// 알림 통계
router.get(
  '/stats',
  authMiddleware,
  validate(notificationValidation.getNotificationStats),
  notificationController.getNotificationStats
);

module.exports = router; 