import Product from '../models/Product.js';
import Order from '../models/Order.js';
import ApiError from '../utils/ApiError.js';
import generateOrderNumber from '../utils/generateOrderNumber.js';
import { isObjectId, roundMoney } from '../utils/helpers.js';
import { ADMIN_CANCELLABLE_STATUSES, ORDER_FLOW, ORDER_STATUS, PAYMENT_STATUS, SHIPPING } from '../utils/constants.js';

const MAX_ORDER_LINES = 50;
const MAX_QUANTITY_PER_LINE = 100;

/** Shipping is free above the threshold, otherwise a flat rate is charged. */
const calculateShipping = (itemsPrice) =>
  itemsPrice === 0 || itemsPrice >= SHIPPING.FREE_THRESHOLD ? 0 : SHIPPING.FLAT_RATE;

/** Calculates the order totals from trusted (database) prices. */
export const calculateOrderPrices = (items) => {
  const itemsPrice = roundMoney(items.reduce((sum, item) => sum + item.price * item.quantity, 0));
  const shippingPrice = calculateShipping(itemsPrice);
  const totalPrice = roundMoney(itemsPrice + shippingPrice);
  return { itemsPrice, shippingPrice, totalPrice };
};

/**
 * Turns the items sent by the browser ([{ product, quantity }]) into trusted order items.
 * - verifies every product exists
 * - verifies there is enough stock
 * - copies the REAL name, image and price from the database
 * Anything else the browser sends (price, name, totals...) is ignored.
 */
export const buildOrderItems = async (requestedItems) => {
  if (!Array.isArray(requestedItems) || requestedItems.length === 0) {
    throw new ApiError(400, 'Your cart is empty');
  }
  if (requestedItems.length > MAX_ORDER_LINES) {
    throw new ApiError(400, `An order can contain at most ${MAX_ORDER_LINES} different products`);
  }

  // Merge duplicate lines of the same product and validate quantities.
  const quantities = new Map();
  for (const item of requestedItems) {
    const productId = String(item?.product ?? '');
    const quantity = Number(item?.quantity);

    if (!isObjectId(productId)) {
      throw new ApiError(400, 'Your cart contains an invalid product');
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY_PER_LINE) {
      throw new ApiError(400, `Quantity must be a whole number between 1 and ${MAX_QUANTITY_PER_LINE}`);
    }
    quantities.set(productId, (quantities.get(productId) || 0) + quantity);
  }

  const products = await Product.find({ _id: { $in: [...quantities.keys()] } });
  const productsById = new Map(products.map((product) => [product._id.toString(), product]));

  return [...quantities.entries()].map(([productId, quantity]) => {
    const product = productsById.get(productId);

    if (!product) {
      throw new ApiError(404, 'A product in your cart is no longer available. Please review your cart.');
    }
    if (product.stock < quantity) {
      throw new ApiError(
        409,
        product.stock === 0
          ? `"${product.name}" is out of stock`
          : `Only ${product.stock} unit(s) of "${product.name}" left in stock`,
      );
    }

    return {
      product: product._id,
      name: product.name,
      image: product.image,
      price: product.price,
      quantity,
    };
  });
};

/** Puts stock back (used when an order is cancelled or could not be saved). */
export const restoreStock = async (items) => {
  if (!items.length) return;
  await Product.bulkWrite(
    items.map((item) => ({
      updateOne: { filter: { _id: item.product }, update: { $inc: { stock: item.quantity } } },
    })),
  );
};

/**
 * Reduces stock for every item. Each update only matches when enough stock is
 * still available ({ stock: { $gte: quantity } }), so two customers can never
 * buy the same last unit. If one item fails, the already-reduced items are restored.
 */
export const reserveStock = async (items) => {
  const reserved = [];

  for (const item of items) {
    const result = await Product.updateOne(
      { _id: item.product, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity } },
    );

    if (result.modifiedCount === 0) {
      await restoreStock(reserved);
      throw new ApiError(409, `"${item.name}" just sold out. Please review your cart.`);
    }
    reserved.push(item);
  }
};

/** Saves a new order with a unique, readable order number (retries on the rare collision). */
export const saveNewOrder = async (orderData) => {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await Order.create({ ...orderData, orderNumber: generateOrderNumber() });
    } catch (error) {
      const isOrderNumberClash = error.code === 11000 && error.keyPattern?.orderNumber;
      if (!isOrderNumberClash || attempt >= 5) throw error;
    }
  }
};

/**
 * Cancels an order only if it is still in one of `allowedStatuses`.
 * The status check and the update happen in ONE database operation, so the
 * same order can never be cancelled (and its stock restored) twice.
 *
 * Known limitation: the status change and the stock restore are two separate writes.
 * If the database failed between them, the order would stay cancelled without its stock
 * coming back. Making both all-or-nothing needs a MongoDB transaction, which requires a
 * replica set (e.g. Atlas) - a plain local MongoDB server does not support transactions.
 */
export const cancelOrder = async (order, { allowedStatuses, note }) => {
  const now = new Date();

  const cancelled = await Order.findOneAndUpdate(
    { _id: order._id, orderStatus: { $in: allowedStatuses } },
    {
      $set: {
        orderStatus: ORDER_STATUS.CANCELLED,
        cancelledAt: now,
        paymentStatus: order.paymentStatus === PAYMENT_STATUS.PAID ? PAYMENT_STATUS.REFUNDED : PAYMENT_STATUS.CANCELLED,
      },
      $push: { statusHistory: { status: ORDER_STATUS.CANCELLED, note, date: now } },
    },
    { returnDocument: 'after', runValidators: true },
  );

  if (!cancelled) {
    throw new ApiError(400, `This order can no longer be cancelled (current status: ${order.orderStatus})`);
  }

  await restoreStock(cancelled.orderItems);
  return cancelled;
};

/** The next step of the normal flow, e.g. "Processing" -> "Shipped" (null for Delivered / Cancelled). */
export const getNextStatus = (status) => {
  const index = ORDER_FLOW.indexOf(status);
  return index === -1 || index === ORDER_FLOW.length - 1 ? null : ORDER_FLOW[index + 1];
};

/**
 * The statuses an admin may set next - the single source of truth for the status rules:
 *  - an order moves forward ONE step at a time (Order Placed -> Confirmed -> ... -> Delivered)
 *  - it can be cancelled at any point before it is delivered
 *  - Delivered and Cancelled orders are final
 */
export const getAllowedStatusUpdates = (status) => {
  const allowed = [];
  const next = getNextStatus(status);
  if (next) allowed.push(next);
  if (ADMIN_CANCELLABLE_STATUSES.includes(status)) allowed.push(ORDER_STATUS.CANCELLED);
  return allowed;
};

/**
 * Moves an order to the next step of the normal flow (e.g. Processing -> Shipped).
 * Orders can never skip a step or go backwards. Cash-on-delivery orders are marked as paid on delivery.
 */
export const advanceOrderStatus = async (order, newStatus, note) => {
  const expected = getNextStatus(order.orderStatus);

  if (newStatus !== expected) {
    throw new ApiError(
      400,
      expected
        ? `Order is "${order.orderStatus}" - the next status can only be "${expected}"`
        : `Order is already "${order.orderStatus}" and its status cannot be changed`,
    );
  }

  const now = new Date();
  const changes = { orderStatus: newStatus };

  if (newStatus === ORDER_STATUS.DELIVERED) {
    changes.deliveredAt = now;
    if (order.paymentStatus === PAYMENT_STATUS.PENDING) {
      changes.paymentStatus = PAYMENT_STATUS.PAID; // cash collected on delivery
      changes.paidAt = now;
    }
  }

  // Only update if nobody else changed the status in the meantime.
  const updated = await Order.findOneAndUpdate(
    { _id: order._id, orderStatus: order.orderStatus },
    { $set: changes, $push: { statusHistory: { status: newStatus, note, date: now } } },
    { returnDocument: 'after', runValidators: true },
  );

  if (!updated) {
    throw new ApiError(409, 'This order was just updated by someone else. Please refresh and try again.');
  }
  return updated;
};
