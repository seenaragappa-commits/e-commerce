import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { LOW_STOCK_THRESHOLD, ORDER_STAGES, ORDER_STATUS, ORDER_STATUSES } from '../utils/constants.js';
import { asString, lastCalendarDays, roundMoney } from '../utils/helpers.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const CHART_DAYS = 7;
const NOT_CANCELLED = { orderStatus: { $ne: ORDER_STATUS.CANCELLED } };

/** Returns the time zone if Node recognises it (e.g. "Asia/Kolkata"), otherwise "UTC". */
const safeTimeZone = (value) => {
  const timeZone = asString(value).slice(0, 64);
  if (!timeZone) return 'UTC';
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return timeZone;
  } catch {
    return 'UTC';
  }
};

/**
 * Revenue and number of orders per calendar day (in `timeZone`) for the last 7 days, oldest first.
 * Days without sales are included with 0.
 */
const getDailySales = async (timeZone, now = new Date()) => {
  // One extra day covers every time zone offset; the grouping uses the real calendar date.
  const chartStart = new Date(now.getTime() - (CHART_DAYS + 1) * DAY_MS);

  let rows;
  try {
    rows = await Order.aggregate([
      { $match: { ...NOT_CANCELLED, createdAt: { $gte: chartStart } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: timeZone } },
          revenue: { $sum: '$totalPrice' },
          orders: { $sum: 1 },
        },
      },
    ]);
  } catch (error) {
    // MongoDB does not know this time zone name - fall back to UTC instead of failing the dashboard.
    if (timeZone !== 'UTC') return getDailySales('UTC', now);
    throw error;
  }

  const byDate = Object.fromEntries(rows.map((row) => [row._id, row]));

  return {
    timeZone,
    days: lastCalendarDays(now, timeZone, CHART_DAYS).map((date) => ({
      date,
      revenue: roundMoney(byDate[date]?.revenue || 0),
      orders: byDate[date]?.orders || 0,
    })),
  };
};

/**
 * Numbers for the admin dashboard.
 * @route   GET /api/admin/stats?tz=Asia/Kolkata
 * @query   tz - the admin's time zone, so "today" in the sales chart matches their calendar (default UTC)
 * @access  Private/Admin
 */
export const getDashboardStats = async (req, res) => {
  const [
    totalProducts,
    totalCustomers,
    totalOrders,
    revenueResult,
    statusCounts,
    lowStockCount,
    outOfStockCount,
    lowStockProducts,
    recentProducts,
    recentOrders,
    dailySales,
    categoryResult,
  ] = await Promise.all([
    Product.countDocuments(),
    User.countDocuments({ role: 'user' }),
    Order.countDocuments(),
    Order.aggregate([
      { $match: NOT_CANCELLED },
      { $group: { _id: null, revenue: { $sum: '$totalPrice' }, orders: { $sum: 1 } } },
    ]),
    Order.aggregate([{ $group: { _id: '$orderStatus', count: { $sum: 1 } } }]),
    Product.countDocuments({ stock: { $lte: LOW_STOCK_THRESHOLD } }),
    Product.countDocuments({ stock: { $lte: 0 } }),
    Product.find({ stock: { $lte: LOW_STOCK_THRESHOLD } })
      .sort({ stock: 1, name: 1 })
      .limit(6)
      .select('name image category price stock'),
    Product.find().sort({ createdAt: -1, _id: -1 }).limit(5).select('name image category price stock rating createdAt'),
    Order.find()
      .select('-statusHistory')
      .sort({ createdAt: -1, _id: -1 })
      .limit(6)
      .populate('user', 'name email'),
    getDailySales(safeTimeZone(req.query.tz)),
    // Revenue per category. Order items keep a copy of the product details, but not the
    // category, so it is looked up from the product (deleted products count as "Other").
    Order.aggregate([
      { $match: NOT_CANCELLED },
      { $unwind: '$orderItems' },
      { $lookup: { from: 'products', localField: 'orderItems.product', foreignField: '_id', as: 'product' } },
      {
        $group: {
          _id: { $ifNull: [{ $arrayElemAt: ['$product.category', 0] }, 'Other'] },
          revenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } },
          units: { $sum: '$orderItems.quantity' },
        },
      },
      { $sort: { revenue: -1 } },
    ]),
  ]);

  const countByStatus = Object.fromEntries(statusCounts.map((item) => [item._id, item.count]));
  const countStage = (statuses) => statuses.reduce((sum, status) => sum + (countByStatus[status] || 0), 0);
  const revenue = revenueResult[0]?.revenue || 0;
  const countedOrders = revenueResult[0]?.orders || 0; // orders that are not cancelled

  res.json({
    totalRevenue: roundMoney(revenue),
    totalOrders,
    totalProducts,
    totalCustomers,
    averageOrderValue: countedOrders ? roundMoney(revenue / countedOrders) : 0,
    // Dashboard cards: pending = placed or confirmed, shipped = shipped or out for delivery.
    ordersSummary: Object.fromEntries(Object.entries(ORDER_STAGES).map(([stage, statuses]) => [stage, countStage(statuses)])),
    orderStages: ORDER_STAGES,
    ordersByStatus: ORDER_STATUSES.map((status) => ({ status, count: countByStatus[status] || 0 })),
    lowStockThreshold: LOW_STOCK_THRESHOLD,
    lowStockCount,
    outOfStockCount,
    lowStockProducts,
    recentProducts,
    recentOrders,
    salesLast7Days: dailySales.days,
    salesByCategory: categoryResult.map((item) => ({
      category: item._id,
      revenue: roundMoney(item.revenue),
      units: item.units,
    })),
    timeZone: dailySales.timeZone,
  });
};

/**
 * All registered accounts (never with passwords) and how many orders each one placed.
 * @route   GET /api/admin/users
 * @access  Private/Admin
 */
export const getUsers = async (_req, res) => {
  const [users, orderTotals] = await Promise.all([
    User.find().sort({ createdAt: -1 }),
    Order.aggregate([
      {
        $group: {
          _id: '$user',
          orders: { $sum: 1 },
          spent: {
            $sum: { $cond: [{ $eq: ['$orderStatus', ORDER_STATUS.CANCELLED] }, 0, '$totalPrice'] },
          },
          lastOrderAt: { $max: '$createdAt' },
        },
      },
    ]),
  ]);

  const totalsByUser = Object.fromEntries(orderTotals.map((item) => [item._id.toString(), item]));

  res.json(
    users.map((user) => {
      const totals = totalsByUser[user._id.toString()];
      return {
        ...user.toJSON(),
        orderCount: totals?.orders || 0,
        totalSpent: roundMoney(totals?.spent || 0),
        lastOrderAt: totals?.lastOrderAt ?? null,
      };
    }),
  );
};
