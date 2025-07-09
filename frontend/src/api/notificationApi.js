import axiosInstance from './axiosInstance';

export const getNotifications = async (page = 1, limit = 10) => {
  const response = await axiosInstance.get('/api/notifications', {
    params: { page, limit }
  });
  return response.data;
};

export const getUnreadCount = async () => {
  const response = await axiosInstance.get('/api/notifications/unread-count');
  return response.data.count;
};

export const markAsRead = async (notificationId) => {
  const response = await axiosInstance.put(`/api/notifications/${notificationId}/read`);
  return response.data;
};

export const markAllAsRead = async () => {
  const response = await axiosInstance.put('/api/notifications/read-all');
  return response.data;
}; 