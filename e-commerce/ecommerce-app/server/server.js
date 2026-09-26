import './config/env.js'; // must be first: loads variables from server/.env
import app from './app.js';
import connectDB from './config/db.js';

const PORT = Number(process.env.PORT) || 5000;

const missing = ['MONGO_URI', 'JWT_SECRET'].filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`\nMissing environment variable(s): ${missing.join(', ')}`);
  console.error('Copy server/.env.example to server/.env and fill in the values.');
  console.error('No MongoDB installed? Run "npm run demo" to start with a temporary in-memory database.\n');
  process.exit(1);
}

if (process.env.JWT_SECRET.length < 32) {
  console.warn('Warning: JWT_SECRET is short. Use a long random value (see server/.env.example) so tokens cannot be guessed.');
}

try {
  await connectDB(process.env.MONGO_URI);
} catch (error) {
  console.error(`\nCould not connect to MongoDB: ${error.message}`);
  console.error('Check that MongoDB is running and that MONGO_URI in server/.env is correct.');
  console.error('No MongoDB installed? Run "npm run demo" to start with a temporary in-memory database.\n');
  process.exit(1);
}

const server = app.listen(PORT, () => {
  console.log(`ShopSphere API running at http://localhost:${PORT}/api (${process.env.NODE_ENV})`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the other process or change PORT in server/.env.`);
  } else {
    console.error(error);
  }
  process.exit(1);
});
