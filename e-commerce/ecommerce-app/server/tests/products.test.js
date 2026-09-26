import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import Product from '../models/Product.js';
import { api, loginAsAdmin, loginAsUser, seedDatabase, startDatabase, stopDatabase } from './helpers.js';

let adminToken;
let userToken;

before(async () => {
  await startDatabase();
  await seedDatabase();
  adminToken = await loginAsAdmin();
  userToken = await loginAsUser();
});

after(stopDatabase);

const newProduct = {
  name: 'Test Product',
  description: 'A product created by the test suite.',
  price: 19.999,
  category: 'Accessories',
  image: '/images/products/placeholder.svg',
  stock: 7,
};

describe('GET /api/products (catalog)', () => {
  it('returns a paginated list', async () => {
    const res = await api().get('/api/products?limit=5');
    assert.equal(res.status, 200);
    assert.equal(res.body.products.length, 5);
    assert.equal(res.body.total, 16);
    assert.equal(res.body.pages, 4);
    assert.equal(res.body.page, 1);
  });

  it('searches by keyword (case-insensitive)', async () => {
    const res = await api().get('/api/products?keyword=KEYBOARD');
    assert.equal(res.status, 200);
    assert.ok(res.body.products.some((p) => p.name === 'Mechanical Gaming Keyboard'));
  });

  it('treats regex characters in the keyword as plain text', async () => {
    const res = await api().get('/api/products?keyword=' + encodeURIComponent('(.*'));
    assert.equal(res.status, 200);
    assert.equal(res.body.total, 0);
  });

  it('filters by category', async () => {
    const res = await api().get('/api/products?category=Gaming&limit=50');
    assert.equal(res.status, 200);
    assert.equal(res.body.total, 3);
    assert.ok(res.body.products.every((p) => p.category === 'Gaming'));
  });

  it('filters by price range', async () => {
    const res = await api().get('/api/products?minPrice=40&maxPrice=60&limit=50');
    assert.equal(res.status, 200);
    assert.ok(res.body.total > 0);
    assert.ok(res.body.products.every((p) => p.price >= 40 && p.price <= 60));
  });

  it('sorts by price (ascending and descending)', async () => {
    const asc = await api().get('/api/products?sort=price-asc&limit=50');
    const ascPrices = asc.body.products.map((p) => p.price);
    assert.deepEqual(ascPrices, [...ascPrices].sort((a, b) => a - b));

    const desc = await api().get('/api/products?sort=price-desc&limit=50');
    const descPrices = desc.body.products.map((p) => p.price);
    assert.deepEqual(descPrices, [...descPrices].sort((a, b) => b - a));
  });

  it('sorts by rating', async () => {
    const res = await api().get('/api/products?sort=rating&limit=50');
    const ratings = res.body.products.map((p) => p.rating);
    assert.deepEqual(ratings, [...ratings].sort((a, b) => b - a));
  });

  it('can hide out-of-stock products and show featured ones', async () => {
    const inStock = await api().get('/api/products?inStock=true&limit=50');
    assert.ok(inStock.body.products.every((p) => p.stock > 0));
    assert.equal(inStock.body.total, 15);

    const featured = await api().get('/api/products?featured=true&limit=50');
    assert.equal(featured.body.total, 8);
  });

  it('filters by inventory level and sorts by stock (admin inventory views)', async () => {
    const low = await api().get('/api/products?stock=low&limit=50');
    assert.ok(low.body.total > 0);
    assert.ok(low.body.products.every((p) => p.stock > 0 && p.stock <= 5));

    const out = await api().get('/api/products?stock=out&limit=50');
    assert.deepEqual(
      out.body.products.map((p) => p.name),
      ['Minimalist Wall Clock'],
    );

    const byStock = await api().get('/api/products?sort=stock-asc&limit=50');
    const stocks = byStock.body.products.map((p) => p.stock);
    assert.deepEqual(stocks, [...stocks].sort((a, b) => a - b));
  });

  it('ignores unknown sort and filter values', async () => {
    for (const query of ['sort=constructor', 'sort=__proto__', 'stock=toString', 'category[$ne]=x']) {
      const res = await api().get(`/api/products?${query}`);
      assert.equal(res.status, 200, query);
    }
  });

  it('lists categories with product counts', async () => {
    const res = await api().get('/api/products/categories');
    assert.equal(res.status, 200);
    assert.deepEqual(
      res.body.map((c) => c.name),
      ['Electronics', 'Fashion', 'Home', 'Accessories', 'Gaming'],
    );
    assert.equal(
      res.body.reduce((sum, c) => sum + c.count, 0),
      16,
    );
  });
});

describe('GET /api/products/:id', () => {
  it('returns one product', async () => {
    const product = await Product.findOne({ name: 'RGB Gaming Mouse' });
    const res = await api().get(`/api/products/${product._id}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.name, 'RGB Gaming Mouse');
  });

  it('returns 404 for an invalid or unknown id', async () => {
    assert.equal((await api().get('/api/products/not-an-id')).status, 404);
    assert.equal((await api().get('/api/products/64b7f0c2a1b2c3d4e5f60718')).status, 404);
  });
});

describe('Admin-only product management', () => {
  it('rejects anonymous users (401) and normal users (403)', async () => {
    const anonymous = await api().post('/api/products').send(newProduct);
    assert.equal(anonymous.status, 401);

    const user = await api().post('/api/products').set('Authorization', `Bearer ${userToken}`).send(newProduct);
    assert.equal(user.status, 403);
  });

  it('lets an admin create, update and delete a product', async () => {
    const created = await api().post('/api/products').set('Authorization', `Bearer ${adminToken}`).send(newProduct);
    assert.equal(created.status, 201);
    assert.equal(created.body.price, 20, 'price is rounded to 2 decimals');
    assert.equal(created.body.rating, 0, 'rating defaults to 0');

    const listed = await api().get('/api/products?keyword=Test%20Product');
    assert.equal(listed.body.total, 1, 'the new product is in the catalog');

    const updated = await api()
      .put(`/api/products/${created.body._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ price: 24.5, stock: 3, rating: 4.25, numReviews: 999 });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.price, 24.5);
    assert.equal(updated.body.stock, 3);
    assert.equal(updated.body.rating, 4.3, 'rating is editable and rounded to 1 decimal');
    assert.equal(updated.body.numReviews, 0, 'the number of reviews cannot be edited');

    const deleted = await api()
      .delete(`/api/products/${created.body._id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(deleted.status, 200);

    const afterDelete = await api().get(`/api/products/${created.body._id}`);
    assert.equal(afterDelete.status, 404);
  });

  it('validates product data', async () => {
    const res = await api()
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: '', price: -5, category: 'Toys', stock: 1.5, rating: 7 });
    assert.equal(res.status, 400);
    assert.ok(res.body.errors.name);
    assert.ok(res.body.errors.price);
    assert.ok(res.body.errors.category);
    assert.ok(res.body.errors.stock);
    assert.ok(res.body.errors.rating);
    assert.ok(res.body.errors.description);
    assert.ok(res.body.errors.image);
  });

  it('requires a price greater than zero and a non-negative stock', async () => {
    const send = (changes) =>
      api().post('/api/products').set('Authorization', `Bearer ${adminToken}`).send({ ...newProduct, ...changes });

    for (const price of [0, -1, '', 'free', null, 0.001]) {
      const res = await send({ price });
      assert.equal(res.status, 400, `price ${JSON.stringify(price)}`);
      assert.ok(res.body.errors.price);
    }
    for (const stock of [-1, '', null, 2.5]) {
      const res = await send({ stock });
      assert.equal(res.status, 400, `stock ${JSON.stringify(stock)}`);
      assert.ok(res.body.errors.stock);
    }
    assert.equal((await send({ stock: 0, price: 0.01, name: 'Zero Stock Item' })).status, 201, 'a stock of 0 is allowed');
  });

  it('only accepts http(s) image URLs or site paths', async () => {
    const send = (image) =>
      api().post('/api/products').set('Authorization', `Bearer ${adminToken}`).send({ ...newProduct, image });

    for (const image of ['javascript:alert(1)', 'not a url', '//evil.example.com/x.png', 'ftp://example.com/a.png']) {
      const res = await send(image);
      assert.equal(res.status, 400, image);
      assert.ok(res.body.errors.image);
    }
    assert.equal((await send('https://example.com/photo.jpg')).status, 201);
  });

  it('validates partial updates too', async () => {
    const product = await Product.findOne({ name: 'RGB Gaming Mouse' });
    const res = await api()
      .put(`/api/products/${product._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ price: 0, stock: -3 });
    assert.equal(res.status, 400);
    assert.ok(res.body.errors.price);
    assert.ok(res.body.errors.stock);
    assert.equal((await Product.findById(product._id)).price, 39.99);
  });

  it('prevents normal users from updating or deleting products', async () => {
    const product = await Product.findOne({ name: 'RGB Gaming Mouse' });
    const update = await api()
      .put(`/api/products/${product._id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ price: 1 });
    assert.equal(update.status, 403);

    const remove = await api().delete(`/api/products/${product._id}`).set('Authorization', `Bearer ${userToken}`);
    assert.equal(remove.status, 403);

    const unchanged = await Product.findById(product._id);
    assert.equal(unchanged.price, 39.99);
  });
});
