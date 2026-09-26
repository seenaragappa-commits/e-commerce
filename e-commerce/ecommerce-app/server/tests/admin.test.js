import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { roundMoney } from '../utils/helpers.js';
import { api, loginAsAdmin, loginAsUser, seedDatabase, startDatabase, stopDatabase, validAddress } from './helpers.js';

let adminToken;
let userToken;

const bearer = (token) => ({ Authorization: `Bearer ${token}` });
const productByName = (name) => Product.findOne({ name });
const sum = (values) => roundMoney(values.reduce((total, value) => total + value, 0));

const setStatus = (id, status, note, token = adminToken) =>
  api().put(`/api/admin/orders/${id}/status`).set(bearer(token)).send({ status, note });

const placeOrder = async (items, paymentMethod = 'Cash on Delivery') => {
  const orderItems = [];
  for (const [name, quantity] of items) {
    orderItems.push({ product: (await productByName(name))._id, quantity });
  }
  return api().post('/api/orders').set(bearer(userToken)).send({ orderItems, shippingAddress: validAddress, paymentMethod });
};

before(startDatabase);

beforeEach(async () => {
  await seedDatabase();
  adminToken = await loginAsAdmin();
  userToken = await loginAsUser();
});

after(stopDatabase);

describe('Admin API authorization', () => {
  const adminEndpoints = (orderId) => [
    ['get', '/api/admin/stats'],
    ['get', '/api/admin/users'],
    ['get', '/api/admin/orders'],
    ['get', `/api/admin/orders/${orderId}`],
    ['put', `/api/admin/orders/${orderId}/status`],
  ];

  it('rejects requests without a token (401)', async () => {
    const order = await Order.findOne({ orderStatus: 'Processing' });
    for (const [method, url] of adminEndpoints(order._id)) {
      const res = await api()[method](url).send({ status: 'Shipped' });
      assert.equal(res.status, 401, `${method.toUpperCase()} ${url}`);
    }
  });

  it('rejects normal users (403) and does not change anything', async () => {
    const order = await Order.findOne({ orderStatus: 'Processing' });
    for (const [method, url] of adminEndpoints(order._id)) {
      const res = await api()[method](url).set(bearer(userToken)).send({ status: 'Shipped' });
      assert.equal(res.status, 403, `${method.toUpperCase()} ${url}`);
    }
    assert.equal((await Order.findById(order._id)).orderStatus, 'Processing');
  });

  it('allows admins', async () => {
    const order = await Order.findOne({ orderStatus: 'Processing' });
    for (const [method, url] of adminEndpoints(order._id)) {
      const res = await api()[method](url).set(bearer(adminToken)).send({ status: 'Shipped' });
      assert.equal(res.status, 200, `${method.toUpperCase()} ${url}`);
    }
  });

  it('never trusts a role written into the token', async () => {
    const customer = await User.findOne({ email: 'user@example.com' });
    const tokenClaimingAdmin = jwt.sign({ id: customer._id.toString(), role: 'admin' }, process.env.JWT_SECRET);
    const res = await api().get('/api/admin/stats').set(bearer(tokenClaimingAdmin));
    assert.equal(res.status, 403);
  });

  it('reads the role from the database on every request', async () => {
    await User.updateOne({ email: 'admin@example.com' }, { role: 'user' });
    assert.equal((await api().get('/api/admin/stats').set(bearer(adminToken))).status, 403, 'demoted admin loses access');

    await User.updateOne({ email: 'user@example.com' }, { role: 'admin' });
    assert.equal((await api().get('/api/admin/stats').set(bearer(userToken))).status, 200, 'promoted user gains access');
  });

  it('rejects tokens of deleted accounts (401)', async () => {
    await User.deleteOne({ email: 'admin@example.com' });
    assert.equal((await api().get('/api/admin/stats').set(bearer(adminToken))).status, 401);
  });
});

describe('GET /api/admin/orders', () => {
  it('lists every order, newest first, with the customer (never the password)', async () => {
    const res = await api().get('/api/admin/orders').set(bearer(adminToken));
    assert.equal(res.status, 200);
    assert.equal(res.body.total, 8);
    assert.equal(res.body.orders.length, 8);

    const dates = res.body.orders.map((order) => new Date(order.createdAt).getTime());
    assert.deepEqual(dates, [...dates].sort((a, b) => b - a));

    for (const order of res.body.orders) {
      assert.ok(order.user.email);
      assert.equal(order.user.password, undefined);
      assert.equal(order.statusHistory, undefined, 'the list does not need the full history');
    }
  });

  it('paginates', async () => {
    const first = await api().get('/api/admin/orders?limit=3').set(bearer(adminToken));
    assert.equal(first.body.orders.length, 3);
    assert.equal(first.body.pages, 3);

    const last = await api().get('/api/admin/orders?limit=3&page=3').set(bearer(adminToken));
    assert.equal(last.body.orders.length, 2);
    assert.equal(last.body.page, 3);
  });

  it('filters by one or several statuses and ignores unknown ones', async () => {
    const delivered = await api().get('/api/admin/orders?status=Delivered').set(bearer(adminToken));
    assert.equal(delivered.body.total, 2);
    assert.ok(delivered.body.orders.every((order) => order.orderStatus === 'Delivered'));

    const pending = await api()
      .get('/api/admin/orders')
      .query({ status: 'Order Placed,Confirmed' })
      .set(bearer(adminToken));
    assert.equal(pending.body.total, 2);
    assert.ok(pending.body.orders.every((order) => ['Order Placed', 'Confirmed'].includes(order.orderStatus)));

    const unknown = await api().get('/api/admin/orders?status=Teleported').set(bearer(adminToken));
    assert.equal(unknown.body.total, 8);
  });

  it('filters by payment status', async () => {
    const res = await api().get('/api/admin/orders?paymentStatus=Pending').set(bearer(adminToken));
    assert.equal(res.body.total, 3);
    assert.ok(res.body.orders.every((order) => order.paymentStatus === 'Pending'));
  });

  it('searches by order number, customer name or email', async () => {
    const byName = await api().get('/api/admin/orders?keyword=david').set(bearer(adminToken));
    assert.equal(byName.body.total, 2);

    const order = await Order.findOne({ orderStatus: 'Processing' });
    const byNumber = await api().get(`/api/admin/orders?keyword=${order.orderNumber.toLowerCase()}`).set(bearer(adminToken));
    assert.equal(byNumber.body.total, 1);
    assert.equal(byNumber.body.orders[0].orderNumber, order.orderNumber);
  });
});

describe('GET /api/admin/orders/:id', () => {
  it('returns the order, the customer, their order statistics and the allowed next statuses', async () => {
    const order = await Order.findOne({ orderStatus: 'Processing' }); // Sara's order
    const res = await api().get(`/api/admin/orders/${order._id}`).set(bearer(adminToken));

    assert.equal(res.status, 200);
    assert.equal(res.body.orderNumber, order.orderNumber);
    assert.equal(res.body.user.email, 'sara@example.com');
    assert.equal(res.body.user.password, undefined);
    assert.equal(res.body.shippingAddress.city, 'New York');
    assert.equal(res.body.statusHistory.length, 3);
    assert.deepEqual(res.body.allowedStatuses, ['Shipped', 'Cancelled']);

    const saraOrders = await Order.find({ user: order.user, orderStatus: { $ne: 'Cancelled' } });
    assert.equal(res.body.customerStats.orderCount, 2);
    assert.equal(res.body.customerStats.totalSpent, sum(saraOrders.map((item) => item.totalPrice)));
  });

  it('offers no status changes for delivered or cancelled orders', async () => {
    for (const status of ['Delivered', 'Cancelled']) {
      const order = await Order.findOne({ orderStatus: status });
      const res = await api().get(`/api/admin/orders/${order._id}`).set(bearer(adminToken));
      assert.deepEqual(res.body.allowedStatuses, [], status);
    }
  });

  it('returns 404 for malformed or unknown ids', async () => {
    assert.equal((await api().get('/api/admin/orders/not-an-id').set(bearer(adminToken))).status, 404);
    assert.equal((await api().get('/api/admin/orders/64b7f0c2a1b2c3d4e5f60718').set(bearer(adminToken))).status, 404);
  });
});

describe('PUT /api/admin/orders/:id/status', () => {
  it('moves an order through every step, one at a time - and the customer sees each change', async () => {
    const placed = await placeOrder([['Fitness Band with Heart-Rate Monitor', 2]]);
    assert.equal(placed.status, 201);
    const id = placed.body._id;

    for (const status of ['Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered']) {
      const res = await setStatus(id, status, `Now ${status}`);
      assert.equal(res.status, 200, `could not set ${status}: ${res.body.message}`);
      assert.equal(res.body.orderStatus, status);

      // Customer tracking reads the same order from MongoDB.
      const tracking = await api().get(`/api/orders/${id}`).set(bearer(userToken));
      assert.equal(tracking.body.orderStatus, status);
      assert.equal(tracking.body.statusHistory.at(-1).status, status);
      assert.equal(tracking.body.statusHistory.at(-1).note, `Now ${status}`);
    }

    const delivered = await Order.findById(id);
    assert.equal(delivered.paymentStatus, 'Paid', 'cash on delivery is paid when delivered');
    assert.ok(delivered.deliveredAt);
    assert.deepEqual(
      delivered.statusHistory.map((entry) => entry.status),
      ['Order Placed', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'],
    );
  });

  it('returns the next allowed statuses after each change', async () => {
    const placed = await placeOrder([['RGB Gaming Mouse', 1]]);
    const res = await setStatus(placed.body._id, 'Confirmed');
    assert.deepEqual(res.body.allowedStatuses, ['Processing', 'Cancelled']);
  });

  it('refuses to skip a step', async () => {
    const placed = await placeOrder([['RGB Gaming Mouse', 1]]);
    const res = await setStatus(placed.body._id, 'Shipped');
    assert.equal(res.status, 400);
    assert.match(res.body.message, /Confirmed/);
    assert.equal((await Order.findById(placed.body._id)).orderStatus, 'Order Placed');
  });

  it('refuses to move an order backwards', async () => {
    const order = await Order.findOne({ orderStatus: 'Processing' });
    assert.equal((await setStatus(order._id, 'Confirmed')).status, 400);
    assert.equal((await setStatus(order._id, 'Order Placed')).status, 400);
    assert.equal((await Order.findById(order._id)).orderStatus, 'Processing');
  });

  it('rejects unknown, missing or malformed status values', async () => {
    const order = await Order.findOne({ orderStatus: 'Processing' });
    assert.equal((await setStatus(order._id, 'Lost in space')).status, 400);
    assert.equal((await setStatus(order._id, undefined)).status, 400);
    assert.equal((await setStatus(order._id, { $ne: null })).status, 400);
    assert.equal((await setStatus(order._id, 'shipped')).status, 400, 'status names are exact');
  });

  it('treats delivered orders as final (they can never return to Processing)', async () => {
    const order = await Order.findOne({ orderStatus: 'Delivered' });
    for (const status of ['Processing', 'Out for Delivery', 'Cancelled']) {
      const res = await setStatus(order._id, status);
      assert.equal(res.status, 400, status);
      assert.match(res.body.message, /already delivered/);
    }
    assert.equal((await Order.findById(order._id)).orderStatus, 'Delivered');
  });

  it('lets the store cancel before delivery: refunds a paid order, restores stock, and the order stays cancelled', async () => {
    const order = await Order.findOne({ orderStatus: 'Out for Delivery' }); // David: keyboard + mouse, demo card
    const keyboardBefore = (await productByName('Mechanical Gaming Keyboard')).stock;
    const mouseBefore = (await productByName('RGB Gaming Mouse')).stock;

    const res = await setStatus(order._id, 'Cancelled', 'Parcel damaged in transit');
    assert.equal(res.status, 200);
    assert.equal(res.body.orderStatus, 'Cancelled');
    assert.equal(res.body.paymentStatus, 'Refunded');
    assert.ok(res.body.cancelledAt);
    assert.equal(res.body.statusHistory.at(-1).note, 'Parcel damaged in transit');
    assert.equal((await productByName('Mechanical Gaming Keyboard')).stock, keyboardBefore + 1);
    assert.equal((await productByName('RGB Gaming Mouse')).stock, mouseBefore + 1);

    for (const status of ['Delivered', 'Order Placed', 'Cancelled']) {
      assert.equal((await setStatus(order._id, status)).status, 400, status);
    }
    assert.equal((await productByName('RGB Gaming Mouse')).stock, mouseBefore + 1, 'stock is restored only once');
  });

  it('stores the optional note (max 200 characters)', async () => {
    const order = await Order.findOne({ orderStatus: 'Processing' });
    const res = await setStatus(order._id, 'Shipped', 'x'.repeat(300));
    assert.equal(res.status, 200);
    assert.equal(res.body.statusHistory.at(-1).note.length, 200);
  });
});

describe('GET /api/admin/stats', () => {
  it('returns store totals and the number of orders in each stage', async () => {
    const res = await api().get('/api/admin/stats').set(bearer(adminToken));
    assert.equal(res.status, 200);
    assert.equal(res.body.totalProducts, 16);
    assert.equal(res.body.totalOrders, 8);
    assert.equal(res.body.totalCustomers, 4, 'admins are not counted as customers');
    assert.deepEqual(res.body.ordersSummary, { pending: 2, processing: 1, shipped: 2, delivered: 2, cancelled: 1 });
    assert.equal(
      res.body.ordersByStatus.reduce((total, item) => total + item.count, 0),
      8,
    );

    const counted = await Order.find({ orderStatus: { $ne: 'Cancelled' } });
    assert.equal(res.body.totalRevenue, sum(counted.map((order) => order.totalPrice)), 'revenue excludes cancelled orders');
    assert.equal(res.body.averageOrderValue, roundMoney(res.body.totalRevenue / counted.length));
  });

  it('lists low-stock products (5 or fewer units) and counts out-of-stock products', async () => {
    const res = await api().get('/api/admin/stats').set(bearer(adminToken));
    assert.equal(res.body.lowStockThreshold, 5);
    assert.equal(res.body.lowStockCount, 3);
    assert.equal(res.body.outOfStockCount, 1);
    assert.ok(res.body.lowStockProducts.every((product) => product.stock <= 5));
    assert.equal(res.body.lowStockProducts[0].name, 'Minimalist Wall Clock');
    assert.equal(res.body.lowStockProducts[0].stock, 0);
  });

  it('includes the most recent products and orders', async () => {
    const res = await api().get('/api/admin/stats').set(bearer(adminToken));
    assert.equal(res.body.recentProducts.length, 5);
    const productDates = res.body.recentProducts.map((product) => new Date(product.createdAt).getTime());
    assert.deepEqual(productDates, [...productDates].sort((a, b) => b - a));

    assert.equal(res.body.recentOrders.length, 6);
    assert.ok(res.body.recentOrders[0].user.name);
  });

  it('returns 7 days of sales in the admin\'s time zone (falls back to UTC)', async () => {
    const res = await api().get('/api/admin/stats?tz=Asia/Kolkata').set(bearer(adminToken));
    const days = res.body.salesLast7Days;
    assert.equal(res.body.timeZone, 'Asia/Kolkata');
    assert.equal(days.length, 7);
    assert.equal(days.at(-1).date, new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date()));
    assert.ok(days.reduce((total, day) => total + day.orders, 0) >= 5, 'the seeded orders of the last days are counted');

    const fallback = await api().get('/api/admin/stats?tz=Not/AZone').set(bearer(adminToken));
    assert.equal(fallback.status, 200);
    assert.equal(fallback.body.timeZone, 'UTC');
  });

  it('reports revenue by category without cancelled orders', async () => {
    const res = await api().get('/api/admin/stats').set(bearer(adminToken));
    const counted = await Order.find({ orderStatus: { $ne: 'Cancelled' } });
    assert.equal(
      sum(res.body.salesByCategory.map((item) => item.revenue)),
      sum(counted.map((order) => order.itemsPrice)),
    );
    assert.ok(res.body.salesByCategory.some((item) => item.category === 'Electronics'));
  });

  it('reflects new orders: stock goes down, low and out-of-stock products show up', async () => {
    const placed = await placeOrder([['Smart Watch with AMOLED Display', 14]], 'Demo Card'); // stock 18 -> 4
    assert.equal(placed.status, 201);

    let stats = (await api().get('/api/admin/stats').set(bearer(adminToken))).body;
    const watch = stats.lowStockProducts.find((product) => product.name === 'Smart Watch with AMOLED Display');
    assert.equal(watch.stock, 4);
    assert.equal(stats.lowStockCount, 4);
    assert.equal(stats.totalOrders, 9);

    assert.equal((await placeOrder([['Smart Watch with AMOLED Display', 4]])).status, 201); // 4 -> 0
    stats = (await api().get('/api/admin/stats').set(bearer(adminToken))).body;
    assert.equal(stats.outOfStockCount, 2);

    const soldOut = await placeOrder([['Smart Watch with AMOLED Display', 1]]);
    assert.equal(soldOut.status, 409);
    assert.match(soldOut.body.message, /out of stock/);
  });
});

describe('GET /api/admin/users', () => {
  it('lists every account without passwords, newest first, with order statistics', async () => {
    const res = await api().get('/api/admin/users').set(bearer(adminToken));
    assert.equal(res.status, 200);
    assert.equal(res.body.length, 5);
    assert.doesNotMatch(JSON.stringify(res.body), /\$2[aby]\$/, 'no password hashes in the response');
    assert.ok(res.body.every((user) => user.password === undefined));

    const joined = res.body.map((user) => new Date(user.createdAt).getTime());
    assert.deepEqual(joined, [...joined].sort((a, b) => b - a));

    const david = res.body.find((user) => user.email === 'david@example.com');
    const davidPaid = await Order.find({ user: david._id, orderStatus: { $ne: 'Cancelled' } });
    assert.equal(david.orderCount, 2);
    assert.equal(david.totalSpent, sum(davidPaid.map((order) => order.totalPrice)), 'cancelled orders are not counted');
    assert.ok(david.lastOrderAt);

    const adminAccount = res.body.find((user) => user.email === 'admin@example.com');
    assert.equal(adminAccount.role, 'admin');
    assert.equal(adminAccount.orderCount, 0);
  });
});
