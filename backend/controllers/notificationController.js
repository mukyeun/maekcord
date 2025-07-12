const Notification = require('../models/Notification');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');

// 읽지 않은 알림 수 조회
const getUnreadCount = catchAsync(async (req, res) => {
  const userId = req.user._id;
  
  const count = await Notification.countDocuments({
    userId,
    isRead: false
  });

  res.json({
    success: true,
    count
  });
});

// 알림 목록 조회
const getNotifications = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 10, type } = req.query;
  
  const query = { userId };
  if (type) {
    query.type = type;
  }

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await Notification.countDocuments(query);

  res.json({
    success: true,
    data: {
      notifications,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit)
    }
  });
});

// 알림 상세 조회
const getNotification = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const notification = await Notification.findOne({ _id: id, userId });

  if (!notification) {
    throw new ApiError(404, '알림을 찾을 수 없습니다.');
  }

  res.json({
    success: true,
    data: notification
  });
});

// 알림 읽음 처리
const markAsRead = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const notification = await Notification.findOneAndUpdate(
    { _id: id, userId },
    { isRead: true },
    { new: true }
  );

  if (!notification) {
    throw new ApiError(404, '알림을 찾을 수 없습니다.');
  }

  res.json({
    success: true,
    data: notification
  });
});

// 모든 알림 읽음 처리
const markAllAsRead = catchAsync(async (req, res) => {
  const userId = req.user._id;

  await Notification.updateMany(
    { userId, isRead: false },
    { isRead: true }
  );

  res.json({
    success: true,
    message: '모든 알림이 읽음 처리되었습니다.'
  });
});

// 알림 삭제
const deleteNotification = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const notification = await Notification.findOneAndDelete({ _id: id, userId });

  if (!notification) {
    throw new ApiError(404, '알림을 찾을 수 없습니다.');
  }

  res.json({
    success: true,
    message: '알림이 삭제되었습니다.'
  });
});

// 알림 설정 조회
const getNotificationSettings = catchAsync(async (req, res) => {
  const userId = req.user._id;
  
  // 사용자의 알림 설정 조회 로직 구현
  res.json({
    success: true,
    data: {
      email: true,
      push: true,
      sms: false
    }
  });
});

// 알림 설정 업데이트
const updateNotificationSettings = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const settings = req.body;
  
  // 알림 설정 업데이트 로직 구현
  res.json({
    success: true,
    message: '알림 설정이 업데이트되었습니다.'
  });
});

// 알림 필터링
const filterNotifications = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { type, priority, startDate, endDate, isRead } = req.query;

  const query = { userId };

  if (type) query.type = type;
  if (priority) query.priority = priority;
  if (isRead !== undefined) query.isRead = isRead === 'true';
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: notifications
  });
});

// 알림 통계
const getNotificationStats = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { startDate, endDate, type } = req.query;

  const query = { userId };

  if (type) query.type = type;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const stats = await Notification.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        read: { $sum: { $cond: ['$isRead', 1, 0] } },
        unread: { $sum: { $cond: ['$isRead', 0, 1] } },
        highPriority: { $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } },
        mediumPriority: { $sum: { $cond: [{ $eq: ['$priority', 'medium'] }, 1, 0] } },
        lowPriority: { $sum: { $cond: [{ $eq: ['$priority', 'low'] }, 1, 0] } }
      }
    }
  ]);

  res.json({
    success: true,
    data: stats[0] || {
      total: 0,
      read: 0,
      unread: 0,
      highPriority: 0,
      mediumPriority: 0,
      lowPriority: 0
    }
  });
});

module.exports = {
  getUnreadCount,
  getNotifications,
  getNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getNotificationSettings,
  updateNotificationSettings,
  filterNotifications,
  getNotificationStats
}; 