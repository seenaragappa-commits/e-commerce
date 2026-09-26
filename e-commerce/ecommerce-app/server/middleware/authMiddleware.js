import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { isObjectId } from '../utils/helpers.js';

/**
 * protect - allows the request only if it has a valid JWT.
 * Expects the header:  Authorization: Bearer <token>
 * On success the logged-in user (loaded fresh from MongoDB) is available as req.user.
 */
export const protect = async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;

  if (!token) {
    throw new ApiError(401, 'Not authorized. Please log in.');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new ApiError(401, 'Your session has expired or is invalid. Please log in again.');
  }

  if (!isObjectId(decoded?.id)) {
    throw new ApiError(401, 'Invalid token. Please log in again.');
  }

  // Load the user from the database so the role is always the current, trusted value.
  const user = await User.findById(decoded.id);
  if (!user) {
    throw new ApiError(401, 'This account no longer exists. Please log in again.');
  }

  req.user = user;
  next();
};

/**
 * admin - must be used after `protect`. Allows only users whose role
 * (as stored in the database) is "admin".
 */
export const admin = (req, _res, next) => {
  if (req.user?.role !== 'admin') {
    throw new ApiError(403, 'Access denied. Admins only.');
  }
  next();
};
