import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import products from './data/products.js';
import users from './data/users.js';
import buildSampleOrders from './data/sampleOrders.js';

const HOUR_MS = 60 * 60 * 1000;

/** Deletes all orders, products and users. */
export const destroyData = async () => {
  await Order.deleteMany({});
  await Product.deleteMany({});
  await User.deleteMany({});
};

/** Replaces the database contents with the demo users, products and sample orders. */
export const importData = async () => {
  await destroyData();

  // User.create runs the pre-save hook, so every password is hashed with bcrypt.
  // timestamps: false keeps the (back-dated) registration dates from the sample data.
  const createdUsers = await User.create(
    users.map((user) => ({ ...user, updatedAt: user.createdAt })),
    { timestamps: false },
  );

  // Give products slightly different creation times so "Newest" sorting follows the list order.
  const now = Date.now();
  const createdProducts = await Product.insertMany(
    products.map((product, index) => ({
      ...product,
      createdAt: new Date(now - index * HOUR_MS),
      updatedAt: new Date(now - index * HOUR_MS),
    })),
  );

  const customers = createdUsers.filter((user) => user.role === 'user');
  const sampleOrders = buildSampleOrders(customers, createdProducts);
  // timestamps: false keeps the (back-dated) createdAt / updatedAt values from the sample data.
  await Order.create(sampleOrders, { timestamps: false });

  return {
    users: createdUsers.length,
    products: createdProducts.length,
    orders: sampleOrders.length,
  };
};
