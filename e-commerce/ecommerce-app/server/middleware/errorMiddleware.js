import ApiError from '../utils/ApiError.js';

/** Handles requests to routes that do not exist. */
export const notFound = (req, _res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

/**
 * Central error handler. Every error thrown in a route ends up here and is
 * converted into a consistent JSON response:  { message, errors? }
 * (Express recognises an error handler by its 4 arguments, so _next must stay.)
 */
export const errorHandler = (err, req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong';
  let errors = err.errors;

  // Mongoose: a value could not be converted (e.g. an invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value for "${err.path}"`;
    errors = undefined;
  }

  // Mongoose: schema validation failed -> send each field's message
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errors = Object.fromEntries(Object.entries(err.errors).map(([field, detail]) => [field, detail.message]));
    message = Object.values(errors)[0] || 'Validation failed';
  }

  // MongoDB: unique index violated (e.g. email already registered)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = field === 'email' ? 'An account with this email already exists' : `Duplicate value for "${field}"`;
    errors = { [field]: message };
  }

  // Invalid JSON body sent to express.json()
  if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Request body contains invalid JSON';
    errors = undefined;
  }

  if (statusCode >= 500) {
    console.error(`[${req.method} ${req.originalUrl}]`, err);
    // Hide internal details from clients in production.
    if (process.env.NODE_ENV === 'production') message = 'Internal server error';
  }

  res.status(statusCode).json(errors ? { message, errors } : { message });
};
