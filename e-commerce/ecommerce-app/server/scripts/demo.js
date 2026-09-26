// Demo mode: runs the API with a temporary in-memory MongoDB that is seeded
// automatically. Useful when MongoDB is not installed. All data is lost when
// the server stops. Usage: npm run demo
import '../config/env.js';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import app from '../app.js';
import connectDB from '../config/db.js';
import { importData } from '../seed/seeder.js';

const PORT = Number(process.env.PORT) || 5000;

// Use the MongoDB binary that `npm install` downloaded into server/node_modules/.cache,
// no matter which folder this script is started from.
const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.env.MONGOMS_DOWNLOAD_DIR ||= path.join(serverRoot, 'node_modules', '.cache', 'mongodb-memory-server');
const { MongoMemoryServer } = await import('mongodb-memory-server');

// Keep the temporary database files in one folder that is wiped on every start,
// so nothing piles up in the system temp folder if the terminal is simply closed.
const dbPath = path.join(serverRoot, '.demo-db');
fs.rmSync(dbPath, { recursive: true, force: true });
fs.mkdirSync(dbPath, { recursive: true });

console.log('Starting a temporary in-memory MongoDB (data is reset every time the server starts)...');
const mongoServer = await MongoMemoryServer.create({ instance: { dbPath } });

process.env.JWT_SECRET ||= crypto.randomBytes(48).toString('hex');

await connectDB(mongoServer.getUri('shopsphere'));
const summary = await importData();
console.log(`Seeded ${summary.users} users, ${summary.products} products and ${summary.orders} sample orders.`);

const server = app.listen(PORT, () => {
  console.log(`ShopSphere API (demo mode) running at http://localhost:${PORT}/api`);
  console.log('Demo accounts: admin@example.com / Admin@123   |   user@example.com / User@123');
  console.log('Sample customers maria@, david@ and sara@example.com use the password Customer@123');
});

server.on('error', async (error) => {
  console.error(error.code === 'EADDRINUSE' ? `Port ${PORT} is already in use.` : error);
  await mongoServer.stop();
  process.exit(1);
});

const shutdown = async () => {
  server.close();
  await mongoose.disconnect();
  await mongoServer.stop();
  fs.rmSync(dbPath, { recursive: true, force: true });
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
