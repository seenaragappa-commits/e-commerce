import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { api, loginAsUser, seedDatabase, startDatabase, stopDatabase } from './helpers.js';

before(async () => {
  await startDatabase();
  await seedDatabase();
});

after(stopDatabase);

describe('POST /api/auth/register', () => {
  it('creates a normal user, hashes the password and returns a token', async () => {
    const res = await api().post('/api/auth/register').send({
      name: 'Priya Sharma',
      email: 'Priya@Example.com',
      password: 'secret123',
      confirmPassword: 'secret123',
    });

    assert.equal(res.status, 201);
    assert.ok(res.body.token);
    assert.equal(res.body.user.email, 'priya@example.com');
    assert.equal(res.body.user.role, 'user');
    assert.equal(res.body.user.password, undefined, 'password hash must never be returned');

    const stored = await User.findOne({ email: 'priya@example.com' }).select('+password');
    assert.notEqual(stored.password, 'secret123');
    assert.match(stored.password, /^\$2[aby]\$/, 'password should be a bcrypt hash');
  });

  it('ignores a "role" sent by the client (cannot self-register as admin)', async () => {
    const res = await api().post('/api/auth/register').send({
      name: 'Sneaky',
      email: 'sneaky@example.com',
      password: 'secret123',
      confirmPassword: 'secret123',
      role: 'admin',
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.user.role, 'user');
  });

  it('validates the input and returns field errors', async () => {
    const res = await api().post('/api/auth/register').send({
      name: 'A',
      email: 'not-an-email',
      password: 'short',
      confirmPassword: 'different',
    });
    assert.equal(res.status, 400);
    assert.ok(res.body.errors.name);
    assert.ok(res.body.errors.email);
    assert.ok(res.body.errors.password);
    assert.ok(res.body.errors.confirmPassword);
  });

  it('rejects a duplicate email with 409', async () => {
    const res = await api().post('/api/auth/register').send({
      name: 'Another Alex',
      email: 'user@example.com',
      password: 'secret123',
      confirmPassword: 'secret123',
    });
    assert.equal(res.status, 409);
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with the demo user account', async () => {
    const res = await api().post('/api/auth/login').send({ email: 'user@example.com', password: 'User@123' });
    assert.equal(res.status, 200);
    assert.ok(res.body.token);
    assert.equal(res.body.user.role, 'user');
  });

  it('logs in with the demo admin account', async () => {
    const res = await api().post('/api/auth/login').send({ email: 'admin@example.com', password: 'Admin@123' });
    assert.equal(res.status, 200);
    assert.equal(res.body.user.role, 'admin');
  });

  it('rejects a wrong password and an unknown email with the same 401 message', async () => {
    const wrongPassword = await api().post('/api/auth/login').send({ email: 'user@example.com', password: 'nope' });
    const unknownEmail = await api().post('/api/auth/login').send({ email: 'ghost@example.com', password: 'nope' });
    assert.equal(wrongPassword.status, 401);
    assert.equal(unknownEmail.status, 401);
    assert.equal(wrongPassword.body.message, unknownEmail.body.message);
  });

  it('blocks NoSQL-injection style payloads', async () => {
    const res = await api().post('/api/auth/login').send({ email: { $gt: '' }, password: { $gt: '' } });
    assert.equal(res.status, 400);
  });

  it('locks an email after 10 wrong passwords (brute-force protection)', async () => {
    await api().post('/api/auth/register').send({
      name: 'Lock Test',
      email: 'lock@example.com',
      password: 'Locked123',
      confirmPassword: 'Locked123',
    });

    for (let attempt = 1; attempt <= 10; attempt += 1) {
      const res = await api().post('/api/auth/login').send({ email: 'lock@example.com', password: `wrong-${attempt}` });
      assert.equal(res.status, 401, `attempt ${attempt}`);
    }

    const locked = await api().post('/api/auth/login').send({ email: 'lock@example.com', password: 'Locked123' });
    assert.equal(locked.status, 429, 'even the right password is refused while locked');
    assert.match(locked.body.message, /Too many failed login attempts/);

    const otherAccount = await api().post('/api/auth/login').send({ email: 'user@example.com', password: 'User@123' });
    assert.equal(otherAccount.status, 200, 'other accounts are not affected');
  });

  it('resets the failed-attempt counter after a successful login', async () => {
    for (let attempt = 1; attempt <= 9; attempt += 1) {
      await api().post('/api/auth/login').send({ email: 'user@example.com', password: 'wrong' });
    }
    assert.equal((await api().post('/api/auth/login').send({ email: 'user@example.com', password: 'User@123' })).status, 200);
    assert.equal((await api().post('/api/auth/login').send({ email: 'user@example.com', password: 'wrong' })).status, 401);
    assert.equal((await api().post('/api/auth/login').send({ email: 'user@example.com', password: 'User@123' })).status, 200);
  });
});

describe('GET /api/auth/me', () => {
  it('requires a token', async () => {
    const res = await api().get('/api/auth/me');
    assert.equal(res.status, 401);
  });

  it('rejects a token signed with a different secret', async () => {
    const user = await User.findOne({ email: 'user@example.com' });
    const forged = jwt.sign({ id: user._id.toString() }, 'attacker-secret');
    const res = await api().get('/api/auth/me').set('Authorization', `Bearer ${forged}`);
    assert.equal(res.status, 401);
  });

  it('returns the logged-in user', async () => {
    const token = await loginAsUser();
    const res = await api().get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.user.email, 'user@example.com');
    assert.equal(res.body.user.password, undefined);
  });
});

describe('PUT /api/auth/profile', () => {
  it('updates the name', async () => {
    const token = await loginAsUser();
    const res = await api()
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Alex J.' });
    assert.equal(res.status, 200);
    assert.equal(res.body.user.name, 'Alex J.');
  });

  it('requires the correct current password to change the password', async () => {
    const token = await loginAsUser();
    const wrong = await api()
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'wrong', newPassword: 'NewPass123', confirmPassword: 'NewPass123' });
    assert.equal(wrong.status, 400);
    assert.ok(wrong.body.errors.currentPassword);

    const ok = await api()
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'User@123', newPassword: 'NewPass123', confirmPassword: 'NewPass123' });
    assert.equal(ok.status, 200);

    const login = await api().post('/api/auth/login').send({ email: 'user@example.com', password: 'NewPass123' });
    assert.equal(login.status, 200);
  });
});
