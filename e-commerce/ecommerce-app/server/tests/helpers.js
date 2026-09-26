// Shared test setup: a real MongoDB (in memory) + the Express app + demo data.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../app.js';
import { importData } from '../seed/seeder.js';

process.env.JWT_SECRET = 'test-jwt-secret';

// Reuse the MongoDB binary cached by `npm install` in server/node_modules/.cache.
const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.env.MONGOMS_DOWNLOAD_DIR ||= path.join(serverRoot, 'node_modules', '.cache', 'mongodb-memory-server');
const { MongoMemoryServer } = await import('mongodb-memory-server');

let mongoServer;

export const api = () => request(app);

export const startDatabase = async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri('shopsphere-test'));
};

export const stopDatabase = async () => {
  await mongoose.disconnect();
  await mongoServer?.stop();
};

export const seedDatabase = () => importData();

export const loginAs = async (email, password) => {
  const res = await api().post('/api/auth/login').send({ email, password });
  if (res.status !== 200) throw new Error(`Login failed for ${email}: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body.token;
};

export const loginAsAdmin = () => loginAs('admin@example.com', 'Admin@123');
export const loginAsUser = () => loginAs('user@example.com', 'User@123');

export const validAddress = {
  fullName: 'Test Customer',
  email: 'test@example.com',
  phone: '+1 555 010 2000',
  address: '10 Test Street',
  city: 'Austin',
  state: 'Texas',
  postalCode: '73301',
  country: 'United States',
};
