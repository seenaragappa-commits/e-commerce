import api from './api';

/**
 * Places an order. Only product ids and quantities are sent -
 * the server looks up the real prices and calculates the totals.
 */
export const createOrder = async ({ cartItems, shippingAddress, paymentMethod }) => {
  const { data } = await api.post('/orders', {
    orderItems: cartItems.map((item) => ({ product: item._id, quantity: item.quantity })),
    shippingAddress,
    paymentMethod,
  });
  return data;
};

export const getMyOrders = async () => {
  const { data } = await api.get('/orders/myorders');
  return data;
};

export const getOrder = async (id) => {
  const { data } = await api.get(`/orders/${id}`);
  return data;
};

export const cancelOrder = async (id) => {
  const { data } = await api.put(`/orders/${id}/cancel`);
  return data;
};

// Admin order management is in adminService.js (/api/admin/orders).
