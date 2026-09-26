import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import {
  api,
  loginAs,
  loginAsAdmin,
  loginAsUser,
  seedDatabase,
  startDatabase,
  stopDatabase,
  validAddress,
} from './helpers.js';

let adminToken;
let userToken;
let otherUserToken;

const productByName = (name) => Product.findOne({ name });

const placeOrder = (token, body) =>
  api().post('/api/orders').set('Authorization', `Bearer ${token}`).send(body);

before(async () => {
  await startDatabase();
});

beforeEach(async () => {
  await seedDatabase();
  adminToken = await loginAsAdmin();
  userToken = await loginAsUser();

  await api().post('/api/auth/register').send({
    name: 'Other Customer',
    email: 'other@example.com',
    password: 'Other123',
    confirmPassword: 'Other123',
  });
  otherUserToken = await loginAs('other@example.com', 'Other123');
});

after(stopDatabase);

describe('POST /api/orders', () => {
  it('requires login', async () => {
    const res = await api().post('/api/orders').send({});
    assert.equal(res.status, 401);
  });

  it('uses database prices, calculates totals on the server and reduces stock', async () => {
    const mouse = await productByName('RGB Gaming Mouse'); // 39.99, stock 60
    const lamp = await productByName('LED Desk Lamp with Wireless Charger'); // 49.99, stock 22

    const res = await placeOrder(userToken, {
      orderItems: [
        { product: mouse._id, quantity: 2, price: 0.01, name: 'Hacked' },
        { product: lamp._id, quantity: 1, price: 0.01 },
      ],
      shippingAddress: validAddress,
      paymentMethod: 'Cash on Delivery',
      itemsPrice: 1,
      shippingPrice: 0,
      totalPrice: 1,
    });

    assert.equal(res.status, 201);
    const order = res.body;
    assert.match(order.orderNumber, /^SS-\d{6}-[A-HJ-NP-Z2-9]{5}$/);
    assert.equal(order.orderItems[0].price, 39.99);
    assert.equal(order.orderItems[0].name, 'RGB Gaming Mouse');
    assert.equal(order.itemsPrice, 129.97);
    assert.equal(order.shippingPrice, 0, 'free shipping at 100 or more');
    assert.equal(order.totalPrice, 129.97);
    assert.equal(order.orderStatus, 'Order Placed');
    assert.equal(order.paymentStatus, 'Pending');
    assert.equal(order.statusHistory.length, 1);
    assert.ok(order.estimatedDelivery);

    assert.equal((await productByName('RGB Gaming Mouse')).stock, 58);
    assert.equal((await productByName('LED Desk Lamp with Wireless Charger')).stock, 21);
  });

  it('charges flat-rate shipping below the free-shipping threshold', async () => {
    const band = await productByName('Fitness Band with Heart-Rate Monitor'); // 29.99
    const res = await placeOrder(userToken, {
      orderItems: [{ product: band._id, quantity: 1 }],
      shippingAddress: validAddress,
      paymentMethod: 'Cash on Delivery',
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.itemsPrice, 29.99);
    assert.equal(res.body.shippingPrice, 9.99);
    assert.equal(res.body.totalPrice, 39.98);
  });

  it('marks demo card payments as paid', async () => {
    const band = await productByName('Fitness Band with Heart-Rate Monitor');
    const res = await placeOrder(userToken, {
      orderItems: [{ product: band._id, quantity: 1 }],
      shippingAddress: validAddress,
      paymentMethod: 'Demo Card',
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.paymentStatus, 'Paid');
    assert.ok(res.body.paidAt);
  });

  it('merges duplicate lines of the same product', async () => {
    const band = await productByName('Fitness Band with Heart-Rate Monitor');
    const res = await placeOrder(userToken, {
      orderItems: [
        { product: band._id, quantity: 1 },
        { product: band._id, quantity: 2 },
      ],
      shippingAddress: validAddress,
      paymentMethod: 'Cash on Delivery',
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.orderItems.length, 1);
    assert.equal(res.body.orderItems[0].quantity, 3);
  });

  it('rejects orders that exceed the available stock', async () => {
    const mugs = await productByName('Ceramic Coffee Mug Set (2 pcs)'); // stock 3
    const res = await placeOrder(userToken, {
      orderItems: [{ product: mugs._id, quantity: 4 }],
      shippingAddress: validAddress,
      paymentMethod: 'Cash on Delivery',
    });
    assert.equal(res.status, 409);
    assert.match(res.body.message, /Only 3/);
    assert.equal((await productByName('Ceramic Coffee Mug Set (2 pcs)')).stock, 3);
  });

  it('rejects out-of-stock products', async () => {
    const clock = await productByName('Minimalist Wall Clock'); // stock 0
    const res = await placeOrder(userToken, {
      orderItems: [{ product: clock._id, quantity: 1 }],
      shippingAddress: validAddress,
      paymentMethod: 'Cash on Delivery',
    });
    assert.equal(res.status, 409);
  });

  it('never sells more than the stock when two orders arrive at the same time', async () => {
    const mugs = await productByName('Ceramic Coffee Mug Set (2 pcs)'); // stock 3
    const body = {
      orderItems: [{ product: mugs._id, quantity: 2 }],
      shippingAddress: validAddress,
      paymentMethod: 'Cash on Delivery',
    };

    const results = await Promise.all([placeOrder(userToken, body), placeOrder(otherUserToken, body)]);
    const statuses = results.map((r) => r.status).sort();

    assert.deepEqual(statuses, [201, 409]);
    assert.equal((await productByName('Ceramic Coffee Mug Set (2 pcs)')).stock, 1);
  });

  it('validates items, address and payment method', async () => {
    const band = await productByName('Fitness Band with Heart-Rate Monitor');
    const base = { orderItems: [{ product: band._id, quantity: 1 }], shippingAddress: validAddress, paymentMethod: 'Cash on Delivery' };

    assert.equal((await placeOrder(userToken, { ...base, orderItems: [] })).status, 400);
    assert.equal((await placeOrder(userToken, { ...base, orderItems: [{ product: 'abc', quantity: 1 }] })).status, 400);
    assert.equal((await placeOrder(userToken, { ...base, orderItems: [{ product: band._id, quantity: 0 }] })).status, 400);
    assert.equal(
      (await placeOrder(userToken, { ...base, orderItems: [{ product: '64b7f0c2a1b2c3d4e5f60718', quantity: 1 }] })).status,
      404,
    );
    assert.equal((await placeOrder(userToken, { ...base, paymentMethod: 'Bitcoin' })).status, 400);

    const badAddress = await placeOrder(userToken, { ...base, shippingAddress: { ...validAddress, phone: '12', postalCode: '' } });
    assert.equal(badAddress.status, 400);
    assert.ok(badAddress.body.errors.phone);
    assert.ok(badAddress.body.errors.postalCode);
  });
});

describe('Reading orders', () => {
  it('returns only the logged-in user\'s orders', async () => {
    const res = await api().get('/api/orders/myorders').set('Authorization', `Bearer ${userToken}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.length, 2, 'the demo user has 2 seeded orders');

    const other = await api().get('/api/orders/myorders').set('Authorization', `Bearer ${otherUserToken}`);
    assert.equal(other.body.length, 0);
  });

  it('always uses the logged-in user as the owner (a "user" in the body is ignored)', async () => {
    const band = await productByName('Fitness Band with Heart-Rate Monitor');
    const other = await api().get('/api/auth/me').set('Authorization', `Bearer ${otherUserToken}`);

    const res = await placeOrder(userToken, {
      user: other.body.user._id,
      orderItems: [{ product: band._id, quantity: 1 }],
      shippingAddress: validAddress,
      paymentMethod: 'Cash on Delivery',
    });
    assert.equal(res.status, 201);

    const saved = await Order.findById(res.body._id).populate('user', 'email');
    assert.equal(saved.user.email, 'user@example.com');
  });

  it('lets the owner and admins view an order, but not other users', async () => {
    const order = await Order.findOne({ orderStatus: 'Shipped' });

    const owner = await api().get(`/api/orders/${order._id}`).set('Authorization', `Bearer ${userToken}`);
    assert.equal(owner.status, 200);
    assert.equal(owner.body.orderNumber, order.orderNumber);

    const stranger = await api().get(`/api/orders/${order._id}`).set('Authorization', `Bearer ${otherUserToken}`);
    assert.equal(stranger.status, 403);

    const adminView = await api().get(`/api/orders/${order._id}`).set('Authorization', `Bearer ${adminToken}`);
    assert.equal(adminView.status, 200);
  });
});

describe('Cancelling orders', () => {
  it('lets a customer cancel a new order and restores the stock', async () => {
    const speaker = await productByName('Portable Bluetooth Speaker'); // stock 40
    const placed = await placeOrder(userToken, {
      orderItems: [{ product: speaker._id, quantity: 3 }],
      shippingAddress: validAddress,
      paymentMethod: 'Demo Card',
    });
    assert.equal((await productByName('Portable Bluetooth Speaker')).stock, 37);

    const cancelled = await api()
      .put(`/api/orders/${placed.body._id}/cancel`)
      .set('Authorization', `Bearer ${userToken}`);
    assert.equal(cancelled.status, 200);
    assert.equal(cancelled.body.orderStatus, 'Cancelled');
    assert.equal(cancelled.body.paymentStatus, 'Refunded');
    assert.equal((await productByName('Portable Bluetooth Speaker')).stock, 40);

    const again = await api().put(`/api/orders/${placed.body._id}/cancel`).set('Authorization', `Bearer ${userToken}`);
    assert.equal(again.status, 400);
    assert.equal((await productByName('Portable Bluetooth Speaker')).stock, 40, 'stock is not restored twice');
  });

  it('does not allow cancelling an order that has already shipped', async () => {
    const shipped = await Order.findOne({ orderStatus: 'Shipped' });
    const res = await api().put(`/api/orders/${shipped._id}/cancel`).set('Authorization', `Bearer ${userToken}`);
    assert.equal(res.status, 400);
  });

  it('does not allow cancelling someone else\'s order', async () => {
    const band = await productByName('Fitness Band with Heart-Rate Monitor');
    const placed = await placeOrder(userToken, {
      orderItems: [{ product: band._id, quantity: 1 }],
      shippingAddress: validAddress,
      paymentMethod: 'Cash on Delivery',
    });
    const res = await api().put(`/api/orders/${placed.body._id}/cancel`).set('Authorization', `Bearer ${otherUserToken}`);
    assert.equal(res.status, 403);
  });
});

describe('Unknown routes', () => {
  it('returns JSON 404', async () => {
    const res = await api().get('/api/does-not-exist');
    assert.equal(res.status, 404);
    assert.ok(res.body.message);
  });

  it('keeps admin order management out of the customer order routes', async () => {
    const order = await Order.findOne({ orderStatus: 'Shipped' });
    const list = await api().get('/api/orders').set('Authorization', `Bearer ${adminToken}`);
    assert.equal(list.status, 404, 'the admin order list lives at /api/admin/orders');

    const status = await api()
      .put(`/api/orders/${order._id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'Out for Delivery' });
    assert.equal(status.status, 404, 'status updates live at /api/admin/orders/:id/status');
  });
});
