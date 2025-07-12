const Joi = require('joi');
const { objectId } = require('./custom.validation');

const getNotifications = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(100),
    type: Joi.string().valid(
      'system',
      'appointment_created',
      'appointment_cancelled',
      'appointment_updated',
      'appointment_reminder',
      'vital_sign_critical',
      'vital_sign_warning',
      'vital_sign_normal',
      'message',
      'waitlist_matched',
      'waitlist_expiring'
    ),
    isRead: Joi.boolean()
  })
};

const getNotification = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required()
  })
};

const markAsRead = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required()
  })
};

const deleteNotification = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required()
  })
};

const updateSettings = {
  body: Joi.object().keys({
    email: Joi.boolean(),
    push: Joi.boolean(),
    sms: Joi.boolean()
  }).min(1)
};

const filterNotifications = {
  query: Joi.object().keys({
    type: Joi.string().valid(
      'system',
      'appointment_created',
      'appointment_cancelled',
      'appointment_updated',
      'appointment_reminder',
      'vital_sign_critical',
      'vital_sign_warning',
      'vital_sign_normal',
      'message',
      'waitlist_matched',
      'waitlist_expiring'
    ),
    priority: Joi.string().valid('low', 'medium', 'high'),
    startDate: Joi.date(),
    endDate: Joi.date(),
    isRead: Joi.boolean()
  })
};

const getNotificationStats = {
  query: Joi.object().keys({
    startDate: Joi.date(),
    endDate: Joi.date(),
    type: Joi.string().valid(
      'system',
      'appointment_created',
      'appointment_cancelled',
      'appointment_updated',
      'appointment_reminder',
      'vital_sign_critical',
      'vital_sign_warning',
      'vital_sign_normal',
      'message',
      'waitlist_matched',
      'waitlist_expiring'
    )
  })
};

module.exports = {
  getNotifications,
  getNotification,
  markAsRead,
  deleteNotification,
  updateSettings,
  filterNotifications,
  getNotificationStats
}; 