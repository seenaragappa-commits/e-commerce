/**
 * An error with an HTTP status code.
 * Throw it from any controller/middleware and the error handler
 * will turn it into a JSON response: { message, errors? }.
 */
class ApiError extends Error {
  constructor(statusCode, message, errors) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    // Optional field-level messages, e.g. { email: 'Email is required' }
    this.errors = errors;
  }
}

export default ApiError;
