import api, { cleanParams } from './api';

// Every request in this file needs an admin account. The server checks the
// token AND the role stored in MongoDB, so hiding the pages is not the only protection.

/** The browser's time zone, so "today" in the dashboard chart matches the admin's calendar. */
const getTimeZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
};

export const getDashboardStats = async () => {
  const { data } = await api.get('/admin/stats', { params: { tz: getTimeZone() } });
  return data;
};

export const getUsers = async () => {
  const { data } = await api.get('/admin/users');
  return data;
};

/**
 * @param {object} params status (one or comma-separated), paymentStatus, keyword, page, limit
 * @returns {Promise<{ orders, page, pages, total }>}
 */
export const getOrders = async (params = {}) => {
  const { data } = await api.get('/admin/orders', { params: cleanParams(params) });
  return data;
};

/** One order with the customer, their order statistics and `allowedStatuses` (the valid next statuses). */
export const getOrder = async (id) => {
  const { data } = await api.get(`/admin/orders/${id}`);
  return data;
};

export const updateOrderStatus = async (id, status, note) => {
  const { data } = await api.put(`/admin/orders/${id}/status`, { status, note });
  return data;
};
