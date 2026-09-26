// Customer order endpoints. The admin order endpoints live in adminOrderController.js.
import Order from '../models/Order.js';
import ApiError from '../utils/ApiError.js';
import {
  CUSTOMER_CANCELLABLE_STATUSES,
  ESTIMATED_DELIVERY_DAYS,
  ORDER_STATUS,
  PAYMENT_METHODS,
  PAYMENT_STATUS,
} from '../utils/constants.js';
import { addDays } from '../utils/helpers.js';
import { firstError, hasErrors, validateShippingAddress } from '../utils/validators.js';
import {
  buildOrderItems,
  calculateOrderPrices,
  cancelOrder,
  reserveStock,
  restoreStock,
  saveNewOrder,
} from '../services/orderService.js';

const SHIPPING_FIELDS = ['fullName', 'email', 'phone', 'address', 'city', 'state', 'postalCode', 'country'];

const cleanShippingAddress = (address) =>
  Object.fromEntries(SHIPPING_FIELDS.map((field) => [field, String(address[field]).trim()]));

const isOrderOwner = (order, user) => {
  const ownerId = order.user?._id ?? order.user;
  return Boolean(ownerId) && ownerId.toString() === user._id.toString();
};

/**
 * Place a new order.
 * @route   POST /api/orders
 * @access  Private
 */
export const createOrder = async (req, res) => {
  const { orderItems, shippingAddress, paymentMethod } = req.body ?? {};

  // 1. The logged-in user was already verified by the `protect` middleware (req.user).
  //    Now validate the shipping address and payment method.
  const addressErrors = validateShippingAddress(shippingAddress);
  if (hasErrors(addressErrors)) {
    throw new ApiError(400, firstError(addressErrors), addressErrors);
  }
  if (!PAYMENT_METHODS.includes(paymentMethod)) {
    throw new ApiError(400, 'Please choose a valid payment method');
  }

  // 2-4. Verify the products exist, check stock and read the REAL prices from the database.
  const items = await buildOrderItems(orderItems);

  // 5. Calculate the totals on the server. Totals sent by the browser are ignored.
  const prices = calculateOrderPrices(items);

  // 7. Reduce stock first (atomically) so two customers can never buy the same last unit.
  await reserveStock(items);

  // 6. Create the order.
  const now = new Date();
  const isDemoCard = paymentMethod === 'Demo Card';

  try {
    const order = await saveNewOrder({
      user: req.user._id,
      orderItems: items,
      shippingAddress: cleanShippingAddress(shippingAddress),
      paymentMethod,
      // DEMO ONLY: no real card is charged. A "Demo Card" order is simply marked as paid.
      paymentStatus: isDemoCard ? PAYMENT_STATUS.PAID : PAYMENT_STATUS.PENDING,
      paidAt: isDemoCard ? now : undefined,
      ...prices,
      orderStatus: ORDER_STATUS.PLACED,
      statusHistory: [{ status: ORDER_STATUS.PLACED, note: 'Order received', date: now }],
      estimatedDelivery: addDays(now, ESTIMATED_DELIVERY_DAYS),
    });

    // 8. Return the saved order. (9-10: the React app clears the cart and shows the confirmation.)
    res.status(201).json(order);
  } catch (error) {
    // Put the stock back if the order could not be saved.
    await restoreStock(items);
    throw error;
  }
};

/**
 * Orders of the logged-in user, newest first.
 * @route   GET /api/orders/myorders
 * @access  Private
 */
export const getMyOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(orders);
};

/**
 * A single order. Customers can only see their own orders; admins can see all.
 * @route   GET /api/orders/:id
 * @access  Private
 */
export const getOrderById = async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  if (!isOrderOwner(order, req.user) && req.user.role !== 'admin') {
    throw new ApiError(403, 'You are not allowed to view this order');
  }

  res.json(order);
};

/**
 * Customers can cancel their own order while it is "Order Placed" or "Confirmed".
 * Stock is returned to the inventory.
 * @route   PUT /api/orders/:id/cancel
 * @access  Private
 */
export const cancelMyOrder = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }
  if (!isOrderOwner(order, req.user)) {
    throw new ApiError(403, 'You can only cancel your own orders');
  }

  const cancelled = await cancelOrder(order, {
    allowedStatuses: CUSTOMER_CANCELLABLE_STATUSES,
    note: 'Cancelled by customer',
  });

  res.json(cancelled);
};
