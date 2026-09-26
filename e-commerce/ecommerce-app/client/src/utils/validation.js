// Client-side validation gives instant feedback. The server repeats every
// check, so these rules are for user experience - not for security.

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const validatePassword = (password) => {
  if (!password || password.length < 6) return 'Password must be at least 6 characters';
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return 'Password must contain at least one letter and one number';
  }
  return '';
};

export const validateLogin = ({ email, password }) => {
  const errors = {};
  if (!EMAIL_REGEX.test(email.trim())) errors.email = 'Please enter a valid email address';
  if (!password) errors.password = 'Please enter your password';
  return errors;
};

export const validateRegister = ({ name, email, password, confirmPassword }) => {
  const errors = {};
  if (name.trim().length < 2) errors.name = 'Name must be at least 2 characters';
  if (!EMAIL_REGEX.test(email.trim())) errors.email = 'Please enter a valid email address';
  const passwordError = validatePassword(password);
  if (passwordError) errors.password = passwordError;
  if (!confirmPassword) errors.confirmPassword = 'Please confirm your password';
  else if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match';
  return errors;
};

export const validateShipping = (form) => {
  const errors = {};
  const phoneDigits = form.phone.replace(/\D/g, '');

  if (form.fullName.trim().length < 2) errors.fullName = 'Please enter your full name';
  if (!EMAIL_REGEX.test(form.email.trim())) errors.email = 'Please enter a valid email address';
  if (!/^[+\d\s()-]+$/.test(form.phone.trim()) || phoneDigits.length < 7 || phoneDigits.length > 15) {
    errors.phone = 'Enter a valid phone number (7-15 digits)';
  }
  if (form.address.trim().length < 5) errors.address = 'Please enter your street address';
  if (!form.city.trim()) errors.city = 'City is required';
  if (!form.state.trim()) errors.state = 'State is required';
  if (!/^[A-Za-z0-9][A-Za-z0-9 -]{1,9}$/.test(form.postalCode.trim())) errors.postalCode = 'Enter a valid postal code';
  if (!form.country.trim()) errors.country = 'Country is required';
  return errors;
};

/** Simple password strength meter: 0 (empty) to 4 (strong). */
export const getPasswordStrength = (password) => {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (/[A-Za-z]/.test(password) && /\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password) || /[A-Z]/.test(password)) score += 1;
  return score;
};
