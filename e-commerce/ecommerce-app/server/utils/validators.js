import { PRODUCT_CATEGORIES } from './constants.js';

// Simple, readable validation helpers. Each validate* function returns an
// object of field -> message. An empty object means the input is valid.

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

export const hasErrors = (errors) => Object.keys(errors).length > 0;

/** Returns the first error message (handy for a single toast message). */
export const firstError = (errors) => Object.values(errors)[0];

export const validateName = (name) => {
  if (!isNonEmptyString(name) || name.trim().length < 2) return 'Name must be at least 2 characters';
  if (name.trim().length > 50) return 'Name cannot exceed 50 characters';
  return null;
};

export const validateEmail = (email) => {
  if (!isNonEmptyString(email) || !EMAIL_REGEX.test(email.trim())) return 'Please enter a valid email address';
  return null;
};

export const validatePassword = (password) => {
  if (typeof password !== 'string' || password.length < 6) return 'Password must be at least 6 characters';
  if (password.length > 128) return 'Password cannot exceed 128 characters';
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return 'Password must contain at least one letter and one number';
  }
  return null;
};

export const validateRegistration = ({ name, email, password, confirmPassword } = {}) => {
  const errors = {};

  const nameError = validateName(name);
  if (nameError) errors.name = nameError;

  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;

  const passwordError = validatePassword(password);
  if (passwordError) errors.password = passwordError;

  if (!confirmPassword) errors.confirmPassword = 'Please confirm your password';
  else if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match';

  return errors;
};

export const validateShippingAddress = (address) => {
  const errors = {};
  if (!address || typeof address !== 'object') {
    return { shippingAddress: 'Shipping address is required' };
  }

  const { fullName, email, phone, address: street, city, state, postalCode, country } = address;

  if (!isNonEmptyString(fullName) || fullName.trim().length < 2) errors.fullName = 'Full name is required';
  if (validateEmail(email)) errors.email = 'A valid email is required';

  const phoneDigits = typeof phone === 'string' ? phone.replace(/\D/g, '') : '';
  if (!isNonEmptyString(phone) || !/^[+\d\s()-]+$/.test(phone) || phoneDigits.length < 7 || phoneDigits.length > 15) {
    errors.phone = 'Enter a valid phone number (7-15 digits)';
  }

  if (!isNonEmptyString(street) || street.trim().length < 5) errors.address = 'Street address is required';
  if (!isNonEmptyString(city)) errors.city = 'City is required';
  if (!isNonEmptyString(state)) errors.state = 'State is required';
  if (!isNonEmptyString(postalCode) || !/^[A-Za-z0-9][A-Za-z0-9 -]{1,9}$/.test(postalCode.trim())) {
    errors.postalCode = 'Enter a valid postal code';
  }
  if (!isNonEmptyString(country)) errors.country = 'Country is required';

  // Keep stored values to a sensible length.
  for (const [field, value] of Object.entries({ fullName, email, address: street, city, state, country })) {
    if (typeof value === 'string' && value.length > 120 && !errors[field]) errors[field] = 'This value is too long';
  }

  return errors;
};

// A full http(s) URL, or a path on this site such as /images/products/mug.svg
const IMAGE_URL_REGEX = /^(https?:\/\/[^\s/$.?#][^\s]*|\/[^\s/][^\s]*)$/i;

// Numbers may arrive as numbers (JSON) or numeric strings (form values).
const toNumber = (value) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') return Number(value);
  return Number.NaN;
};

/**
 * Validates product data sent by an admin.
 * With { partial: true } (updates) only the fields that were sent are checked.
 */
export const validateProductInput = (data, { partial = false } = {}) => {
  const errors = {};
  const has = (field) => data[field] !== undefined;
  const check = (field) => !partial || has(field);

  if (check('name')) {
    const length = isNonEmptyString(data.name) ? data.name.trim().length : 0;
    if (length < 2 || length > 120) errors.name = 'Name must be between 2 and 120 characters';
  }
  if (check('description')) {
    const length = isNonEmptyString(data.description) ? data.description.trim().length : 0;
    if (length < 10 || length > 2000) errors.description = 'Description must be between 10 and 2000 characters';
  }
  if (check('price')) {
    const price = toNumber(data.price);
    if (!Number.isFinite(price) || price < 0.01 || price > 1000000) {
      errors.price = 'Price must be greater than 0 (max 1,000,000)';
    }
  }
  if (check('category') && !PRODUCT_CATEGORIES.includes(data.category)) {
    errors.category = `Category must be one of: ${PRODUCT_CATEGORIES.join(', ')}`;
  }
  if (check('image')) {
    if (!isNonEmptyString(data.image)) errors.image = 'Image URL is required';
    else if (data.image.trim().length > 500 || !IMAGE_URL_REGEX.test(data.image.trim())) {
      errors.image = 'Image must be a valid http(s) URL or a path starting with "/"';
    }
  }
  if (check('stock')) {
    const stock = toNumber(data.stock);
    if (!Number.isInteger(stock) || stock < 0 || stock > 100000) {
      errors.stock = 'Stock must be a whole number of 0 or more (max 100,000)';
    }
  }
  // Rating is optional when creating a product (it defaults to 0).
  if (has('rating')) {
    const rating = toNumber(data.rating);
    if (!Number.isFinite(rating) || rating < 0 || rating > 5) {
      errors.rating = 'Rating must be a number between 0 and 5';
    }
  }
  if (has('isFeatured') && typeof data.isFeatured !== 'boolean') {
    errors.isFeatured = 'Featured must be true or false';
  }

  return errors;
};
