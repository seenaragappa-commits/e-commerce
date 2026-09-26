// Usage:
//   npm run seed           -> reset the database with demo users, products and sample orders
//   npm run seed:destroy   -> delete all data
import '../config/env.js';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import { destroyData, importData } from './seeder.js';

const shouldDestroy = process.argv.includes('--destroy');

try {
  await connectDB();

  if (shouldDestroy) {
    await destroyData();
    console.log('All users, products and orders were deleted.');
  } else {
    const summary = await importData();
    console.log(`Seeded ${summary.users} users, ${summary.products} products and ${summary.orders} sample orders.`);
    console.log('\nDemo accounts:');
    console.log('  Admin -> admin@example.com / Admin@123');
    console.log('  User  -> user@example.com  / User@123');
    console.log('  (sample customers maria@, david@ and sara@example.com use Customer@123)\n');
  }
} catch (error) {
  console.error(`Seeding failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
