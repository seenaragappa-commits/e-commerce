import User from '../models/User.js';
import { clearFailedLogins, recordFailedLogin } from '../middleware/loginLimiter.js';
import ApiError from '../utils/ApiError.js';
import generateToken from '../utils/generateToken.js';
import {
  firstError,
  hasErrors,
  validateEmail,
  validateName,
  validatePassword,
  validateRegistration,
} from '../utils/validators.js';

const sendAuthResponse = (res, user, statusCode = 200) => {
  res.status(statusCode).json({ user, token: generateToken(user._id) });
};

/**
 * @route   POST /api/auth/register
 * @access  Public
 */
export const registerUser = async (req, res) => {
  const errors = validateRegistration(req.body);
  if (hasErrors(errors)) {
    throw new ApiError(400, firstError(errors), errors);
  }

  const name = req.body.name.trim();
  const email = req.body.email.trim().toLowerCase();

  if (await User.exists({ email })) {
    throw new ApiError(409, 'An account with this email already exists', { email: 'This email is already registered' });
  }

  // The role is intentionally NOT taken from the request body:
  // every new account is a normal "user". Admins are created by the seed script.
  const user = await User.create({ name, email, password: req.body.password });

  sendAuthResponse(res, user, 201);
};

/**
 * @route   POST /api/auth/login
 * @access  Public
 */
export const loginUser = async (req, res) => {
  const { email, password } = req.body ?? {};

  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
    throw new ApiError(400, 'Email and password are required');
  }

  // The password field is hidden by default, so ask for it explicitly.
  const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');

  // Same message for "no such user" and "wrong password" so attackers can't discover accounts.
  if (!user || !(await user.matchPassword(password))) {
    recordFailedLogin(req); // too many failures lock this email for a while (see loginLimiter.js)
    throw new ApiError(401, 'Invalid email or password');
  }

  clearFailedLogins(req);
  sendAuthResponse(res, user);
};

/**
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res) => {
  res.json({ user: req.user });
};

/**
 * Update name / email, and optionally change the password.
 * @route   PUT /api/auth/profile
 * @access  Private
 */
export const updateProfile = async (req, res) => {
  const { name, email, currentPassword, newPassword, confirmPassword } = req.body ?? {};
  const user = await User.findById(req.user._id).select('+password');
  const errors = {};

  if (name !== undefined) {
    const nameError = validateName(name);
    if (nameError) errors.name = nameError;
    else user.name = name.trim();
  }

  if (email !== undefined) {
    const emailError = validateEmail(email);
    if (emailError) {
      errors.email = emailError;
    } else {
      const normalizedEmail = email.trim().toLowerCase();
      const takenByOther = await User.exists({ email: normalizedEmail, _id: { $ne: user._id } });
      if (takenByOther) errors.email = 'This email is already used by another account';
      else user.email = normalizedEmail;
    }
  }

  if (newPassword !== undefined && newPassword !== '') {
    if (typeof currentPassword !== 'string' || !(await user.matchPassword(currentPassword))) {
      errors.currentPassword = 'Current password is incorrect';
    }
    const passwordError = validatePassword(newPassword);
    if (passwordError) errors.newPassword = passwordError;
    if (newPassword !== confirmPassword) errors.confirmPassword = 'Passwords do not match';

    if (!errors.currentPassword && !passwordError && newPassword === confirmPassword) {
      user.password = newPassword; // hashed by the pre-save hook
    }
  }

  // Note: 400 (not 401) for a wrong current password, so the app does not log the user out.
  if (hasErrors(errors)) {
    throw new ApiError(400, firstError(errors), errors);
  }

  await user.save();
  res.json({ user });
};
