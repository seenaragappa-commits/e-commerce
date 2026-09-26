import Order from '../models/Order.js';
import ApiError from '../utils/ApiError.js';
import { ADMIN_CANCELLABLE_STATUSES, ORDER_STATUS, ORDER_STATUSES, PAYMENT_STATUSES } from '../utils/constants.js';
import { asString, escapeRegex, roundMoney, toBoundedInt } from '../utils/helpers.js';
import { advanceOrderStatus, cancelOrder, getAllowedStatusUpdates } from '../services/orderService.js';

const CUSTOMER_FIELDS = 'name email role createdAt';

/** The order as JSON plus the statuses the admin may set next (so the UI never has to guess the rules). */
const toAdminOrder = (order, extra = {}) => ({
  ...order.toJSON(),
  allowedStatuses: getAllowedStatusUpdates(order.orderStatus),
  ...extra,
});

/** "Shipped,Out for Delivery" -> ['Shipped', 'Out for Delivery'] (unknown values are ignored). */
const parseStatusList = (value) =>
  asString(value)
    .split(',')
    .map((status) => status.trim())
    .filter((status) => ORDER_STATUSES.includes(status));

/**
 * All orders, newest first.
 * Filters: status (one status or a comma-separated list), paymentStatus,
 * keyword (order number, customer name or email), page, limit.
 * @route   GET /api/admin/orders
 * @access  Private/Admin
 */
export const getOrders = async (req, res) => {
  const statuses = parseStatusList(req.query.status);
  const paymentStatus = asString(req.query.paymentStatus);
  const keyword = asString(req.query.keyword);
  const page = toBoundedInt(req.query.page, 1, 1, 10000);
  const limit = toBoundedInt(req.query.limit, 20, 1, 100);

  const filter = {};
  if (statuses.length > 0) filter.orderStatus = { $in: statuses };
  if (PAYMENT_STATUSES.includes(paymentStatus)) filter.paymentStatus = paymentStatus;
  if (keyword) {
    const regex = new RegExp(escapeRegex(keyword.slice(0, 100)), 'i');
    filter.$or = [{ orderNumber: regex }, { 'shippingAddress.fullName': regex }, { 'shippingAddress.email': regex }];
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .select('-statusHistory')
      .populate('user', CUSTOMER_FIELDS)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  res.json({ orders, page, pages: Math.max(1, Math.ceil(total / limit)), total });
};

/**
 * One order with the customer's details, their order history summary
 * and the statuses the order may move to next.
 * @route   GET /api/admin/orders/:id
 * @access  Private/Admin
 */
export const getOrderById = async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', CUSTOMER_FIELDS);
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  let customerStats = { orderCount: 0, totalSpent: 0 };
  if (order.user) {
    const [summary] = await Order.aggregate([
      { $match: { user: order.user._id } },
      {
        $group: {
          _id: null,
          orderCount: { $sum: 1 },
          totalSpent: { $sum: { $cond: [{ $eq: ['$orderStatus', ORDER_STATUS.CANCELLED] }, 0, '$totalPrice'] } },
        },
      },
    ]);
    if (summary) customerStats = { orderCount: summary.orderCount, totalSpent: roundMoney(summary.totalSpent) };
  }

  res.json(toAdminOrder(order, { customerStats }));
};

/**
 * Change the status of an order. Body: { status, note? }
 * Rules (see getAllowedStatusUpdates): one step forward at a time, or "Cancelled"
 * before delivery. Delivered and Cancelled orders cannot be changed.
 * Cancelling puts the items back in stock.
 * @route   PUT /api/admin/orders/:id/status
 * @access  Private/Admin
 */
export const updateOrderStatus = async (req, res) => {
  const status = asString(req.body?.status);
  const note = asString(req.body?.note).slice(0, 200) || undefined;

  if (!ORDER_STATUSES.includes(status)) {
    throw new ApiError(400, `Invalid status. Use one of: ${ORDER_STATUSES.join(', ')}`);
  }

  const order = await Order.findById(req.params.id);
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  const allowed = getAllowedStatusUpdates(order.orderStatus);
  if (allowed.length === 0) {
    throw new ApiError(400, `This order is already ${order.orderStatus.toLowerCase()} and its status can no longer be changed`);
  }
  if (!allowed.includes(status)) {
    const options = allowed.map((value) => `"${value}"`).join(' or ');
    throw new ApiError(400, `An order that is "${order.orderStatus}" can only be changed to ${options}`);
  }

  const updated =
    status === ORDER_STATUS.CANCELLED
      ? await cancelOrder(order, { allowedStatuses: ADMIN_CANCELLABLE_STATUSES, note: note || 'Cancelled by the store' })
      : await advanceOrderStatus(order, status, note);

  await updated.populate('user', CUSTOMER_FIELDS);
  res.json(toAdminOrder(updated));
};
