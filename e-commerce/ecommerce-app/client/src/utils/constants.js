export const APP_NAME = 'ShopSphere';
export const TAGLINE = 'Simple Shopping. Smarter Experience.';

export const CATEGORIES = ['Electronics', 'Fashion', 'Home', 'Accessories', 'Gaming'];

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest arrivals' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top rated' },
  { value: 'name', label: 'Name: A to Z' },
];

export const PRICE_RANGES = [
  { label: 'Under $50', min: '', max: '50' },
  { label: '$50 to $100', min: '50', max: '100' },
  { label: '$100 to $250', min: '100', max: '250' },
  { label: '$250 & above', min: '250', max: '' },
];

// Mirrors server/utils/constants.js. The cart uses these for a live estimate,
// but the server always recalculates the real totals when an order is placed.
export const FREE_SHIPPING_THRESHOLD = 100;
export const SHIPPING_FEE = 9.99;
export const LOW_STOCK_THRESHOLD = 5;

export const ORDER_FLOW = ['Order Placed', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'];
export const ORDER_STATUSES = [...ORDER_FLOW, 'Cancelled'];
export const CUSTOMER_CANCELLABLE_STATUSES = ['Order Placed', 'Confirmed'];

export const PAYMENT_METHODS = [
  {
    value: 'Cash on Delivery',
    label: 'Cash on Delivery',
    description: 'Pay in cash when your order arrives at your door.',
  },
  {
    value: 'Demo Card',
    label: 'Demo Card Payment',
    description: 'A simulated card payment for this demo. No card details are collected and no money is charged.',
  },
];

export const PAYMENT_METHOD_LABELS = Object.fromEntries(PAYMENT_METHODS.map((m) => [m.value, m.label]));

export const STORAGE_KEYS = {
  token: 'shopsphere_token',
  cart: 'shopsphere_cart',
  shippingAddress: 'shopsphere_shipping_address',
};

export const PLACEHOLDER_IMAGE = '/images/products/placeholder.svg';
