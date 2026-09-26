import mongoose from 'mongoose';

/**
 * Connects Mongoose to MongoDB.
 * Fails fast (after 5 seconds) with a clear error if MongoDB is not reachable.
 */
const connectDB = async (uri = process.env.MONGO_URI) => {
  if (!uri) {
    throw new Error('MONGO_URI is not set. Add it to server/.env');
  }

  mongoose.set('strictQuery', true);

  const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  console.log(`MongoDB connected: ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`);
  return conn;
};

export default connectDB;
