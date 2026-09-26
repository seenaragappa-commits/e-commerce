// Business rules shared by the models, controllers and seed data.
// The React app keeps a copy of the display values (client/src/utils/constants.js),
// but the server is always the source of truth.

export const PRODUCT_CATEGORIES = ['Electronics', 'Fashion', 'Home', 'Accessories', 'Gaming'];

export const ROLES = ['user', 'admin'];

export const ORDER_STATUS = {
  PLACED: 'Order Placed',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

// The normal journey of an order, in order. "Cancelled" can interrupt it.
export const ORDER_FLOW = [
  ORDER_STATUS.PLACED,
  ORDER_STATUS.CONFIRMED,
  ORDER_STATUS.PROCESSING,
  ORDER_STATUS.SHIPPED,
  ORDER_STATUS.OUT_FOR_DELIVERY,
  ORDER_STATUS.DELIVERED,
];

export const ORDER_STATUSES = [...ORDER_FLOW, ORDER_STATUS.CANCELLED];

// Customers may cancel their own order only before it is being processed.
export const CUSTOMER_CANCELLABLE_STATUSES = [ORDER_STATUS.PLACED, ORDER_STATUS.CONFIRMED];

// The store may cancel an order at any point before it is delivered
// (e.g. the item is damaged, the parcel was lost or the customer refused it).
export const ADMIN_CANCELLABLE_STATUSES = ORDER_FLOW.filter((status) => status !== ORDER_STATUS.DELIVERED);

// Groups of statuses shown as cards on the admin dashboard.
export const ORDER_STAGES = {
  pending: [ORDER_STATUS.PLACED, ORDER_STATUS.CONFIRMED],
  processing: [ORDER_STATUS.PROCESSING],
  shipped: [ORDER_STATUS.SHIPPED, ORDER_STATUS.OUT_FOR_DELIVERY],
  delivered: [ORDER_STATUS.DELIVERED],
  cancelled: [ORDER_STATUS.CANCELLED],
};

export const PAYMENT_METHODS = ['Cash on Delivery', 'Demo Card'];

export const PAYMENT_STATUS = {
  PENDING: 'Pending',
  PAID: 'Paid',
  REFUNDED: 'Refunded',
  CANCELLED: 'Cancelled',
};

export const PAYMENT_STATUSES = Object.values(PAYMENT_STATUS);

// Shipping is free when the items total reaches FREE_THRESHOLD, otherwise FLAT_RATE is charged.
export const SHIPPING = {
  FREE_THRESHOLD: 100,
  FLAT_RATE: 9.99,
};

export const ESTIMATED_DELIVERY_DAYS = 5;

// A product with this many units or fewer is "low on stock" (0 = out of stock).
export const LOW_STOCK_THRESHOLD = 5;
