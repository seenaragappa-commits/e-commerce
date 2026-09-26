import generateOrderNumber from '../../utils/generateOrderNumber.js';
import { calculateOrderPrices } from '../../services/orderService.js';
import { ESTIMATED_DELIVERY_DAYS, ORDER_FLOW, ORDER_STATUS, PAYMENT_STATUS } from '../../utils/constants.js';
import { addDays } from '../../utils/helpers.js';

const HOUR_MS = 60 * 60 * 1000;
const hoursAgo = (hours) => new Date(Date.now() - hours * HOUR_MS);

// Typical time (hours after the order was placed) at which each step of the flow happens.
const STEP_OFFSET_HOURS = {
  [ORDER_STATUS.PLACED]: 0,
  [ORDER_STATUS.CONFIRMED]: 1,
  [ORDER_STATUS.PROCESSING]: 18,
  [ORDER_STATUS.SHIPPED]: 30,
  [ORDER_STATUS.OUT_FOR_DELIVERY]: 72,
  [ORDER_STATUS.DELIVERED]: 78,
};

const DEFAULT_NOTES = {
  [ORDER_STATUS.PLACED]: 'Order received',
  [ORDER_STATUS.CONFIRMED]: 'Order confirmed by the store',
  [ORDER_STATUS.PROCESSING]: 'Packed at the San Jose warehouse',
  [ORDER_STATUS.SHIPPED]: 'Handed over to the courier',
  [ORDER_STATUS.OUT_FOR_DELIVERY]: 'Out with the local delivery partner',
  [ORDER_STATUS.DELIVERED]: 'Delivered to the customer',
};

/**
 * The sample orders: who ordered what, when, and how far each order got.
 * Together they cover every order status and the last 7 days of the sales chart.
 * (Stock levels in products.js are the inventory AFTER these orders.)
 */
const ORDER_SPECS = [
  {
    customer: 'user@example.com',
    items: [
      ['Lightweight Running Shoes', 1],
      ['Fitness Band with Heart-Rate Monitor', 1],
    ],
    paymentMethod: 'Demo Card',
    placedHoursAgo: 12 * 24,
    reached: ORDER_STATUS.DELIVERED,
    notes: { [ORDER_STATUS.CONFIRMED]: 'Payment verified', [ORDER_STATUS.DELIVERED]: 'Left at the front door' },
  },
  {
    customer: 'user@example.com',
    items: [['Wireless Noise-Cancelling Headphones', 1]],
    paymentMethod: 'Cash on Delivery',
    placedHoursAgo: 2 * 24,
    reached: ORDER_STATUS.SHIPPED,
  },
  {
    customer: 'maria@example.com',
    items: [['Smart Watch with AMOLED Display', 1]],
    paymentMethod: 'Demo Card',
    placedHoursAgo: 6 * 24 + 2,
    reached: ORDER_STATUS.DELIVERED,
  },
  {
    customer: 'maria@example.com',
    items: [['Portable Bluetooth Speaker', 2]],
    paymentMethod: 'Cash on Delivery',
    placedHoursAgo: 3,
    reached: ORDER_STATUS.PLACED,
  },
  {
    customer: 'david@example.com',
    items: [
      ['Mechanical Gaming Keyboard', 1],
      ['RGB Gaming Mouse', 1],
    ],
    paymentMethod: 'Demo Card',
    placedHoursAgo: 4 * 24 + 5,
    reached: ORDER_STATUS.OUT_FOR_DELIVERY,
  },
  {
    customer: 'david@example.com',
    items: [['Wireless Game Controller', 2]],
    paymentMethod: 'Cash on Delivery',
    placedHoursAgo: 5 * 24,
    reached: ORDER_STATUS.CONFIRMED,
    cancelled: { note: 'Cancelled by customer', afterHours: 4 },
  },
  {
    customer: 'sara@example.com',
    items: [
      ['Aluminium Laptop Stand', 1],
      ['7-in-1 USB-C Hub', 1],
    ],
    paymentMethod: 'Demo Card',
    placedHoursAgo: 26,
    reached: ORDER_STATUS.PROCESSING,
  },
  {
    customer: 'sara@example.com',
    items: [['LED Desk Lamp with Wireless Charger', 1]],
    paymentMethod: 'Cash on Delivery',
    placedHoursAgo: 20,
    reached: ORDER_STATUS.CONFIRMED,
  },
];

const ADDRESSES = {
  'user@example.com': {
    phone: '+1 415 555 0132',
    address: '221 Market Street, Apt 4B',
    city: 'San Francisco',
    state: 'California',
    postalCode: '94105',
  },
  'maria@example.com': {
    phone: '+1 512 555 0178',
    address: '48 Congress Avenue, Suite 210',
    city: 'Austin',
    state: 'Texas',
    postalCode: '73301',
  },
  'david@example.com': {
    phone: '+1 206 555 0119',
    address: '1500 Pine Street',
    city: 'Seattle',
    state: 'Washington',
    postalCode: '98101',
  },
  'sara@example.com': {
    phone: '+1 646 555 0145',
    address: '77 West 55th Street, Floor 3',
    city: 'New York',
    state: 'New York',
    postalCode: '10019',
  },
};

const toOrderItem = (product, quantity) => ({
  product: product._id,
  name: product.name,
  image: product.image,
  price: product.price,
  quantity,
});

/** Builds one complete order document (history, payment and dates all consistent with the status rules). */
const buildOrder = (spec, customer, findProduct) => {
  const placedAt = hoursAgo(spec.placedHoursAgo);
  const items = spec.items.map(([name, quantity]) => toOrderItem(findProduct(name), quantity));
  const steps = ORDER_FLOW.slice(0, ORDER_FLOW.indexOf(spec.reached) + 1);

  // Squeeze the timeline for recent orders so every step happened before "now".
  const lastOffset = STEP_OFFSET_HOURS[spec.reached] || 1;
  const scale = Math.min(1, (spec.placedHoursAgo - 1) / lastOffset);
  const dateOf = (status) => new Date(placedAt.getTime() + STEP_OFFSET_HOURS[status] * scale * HOUR_MS);

  const statusHistory = steps.map((status) => ({
    status,
    note: spec.notes?.[status] ?? DEFAULT_NOTES[status],
    date: dateOf(status),
  }));

  const isDemoCard = spec.paymentMethod === 'Demo Card';
  const order = {
    orderNumber: generateOrderNumber(placedAt),
    user: customer._id,
    orderItems: items,
    shippingAddress: {
      fullName: customer.name,
      email: customer.email,
      country: 'United States',
      ...ADDRESSES[customer.email],
    },
    paymentMethod: spec.paymentMethod,
    // Demo card orders are paid when placed; cash on delivery is paid when delivered.
    paymentStatus: isDemoCard ? PAYMENT_STATUS.PAID : PAYMENT_STATUS.PENDING,
    paidAt: isDemoCard ? placedAt : undefined,
    ...calculateOrderPrices(items),
    orderStatus: spec.reached,
    statusHistory,
    estimatedDelivery: addDays(placedAt, ESTIMATED_DELIVERY_DAYS),
    createdAt: placedAt,
  };

  if (spec.reached === ORDER_STATUS.DELIVERED) {
    order.deliveredAt = dateOf(ORDER_STATUS.DELIVERED);
    if (!isDemoCard) {
      order.paymentStatus = PAYMENT_STATUS.PAID;
      order.paidAt = order.deliveredAt;
    }
  }

  if (spec.cancelled) {
    const cancelledAt = new Date(placedAt.getTime() + spec.cancelled.afterHours * HOUR_MS);
    order.orderStatus = ORDER_STATUS.CANCELLED;
    order.cancelledAt = cancelledAt;
    order.paymentStatus = isDemoCard ? PAYMENT_STATUS.REFUNDED : PAYMENT_STATUS.CANCELLED;
    order.statusHistory.push({ status: ORDER_STATUS.CANCELLED, note: spec.cancelled.note, date: cancelledAt });
  }

  order.updatedAt = order.statusHistory.at(-1).date;
  return order;
};

/**
 * Example orders for the demo customers so "My Orders", the tracking timeline
 * and the admin dashboard have something to show right after seeding.
 * The demo customer (user@example.com) gets two of them: one delivered and one on its way.
 */
const buildSampleOrders = (customers, products) => {
  const findProduct = (name) => {
    const product = products.find((item) => item.name === name);
    if (!product) throw new Error(`Seed product not found: ${name}`);
    return product;
  };

  return ORDER_SPECS.map((spec) => {
    const customer = customers.find((user) => user.email === spec.customer);
    if (!customer) throw new Error(`Seed customer not found: ${spec.customer}`);
    return buildOrder(spec, customer, findProduct);
  });
};

export default buildSampleOrders;
