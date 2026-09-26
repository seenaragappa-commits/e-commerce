import jwt from 'jsonwebtoken';

/**
 * Creates a signed JWT for a user.
 * Only the user id is stored in the token - the role is always read
 * from the database, so a token can never "grant" admin access.
 */
const generateToken = (userId) =>
  jwt.sign({ id: userId.toString() }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

export default generateToken;
