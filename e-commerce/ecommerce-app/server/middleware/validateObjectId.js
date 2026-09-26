import ApiError from '../utils/ApiError.js';
import { isObjectId } from '../utils/helpers.js';

/**
 * Rejects requests whose :id route parameter is not a valid MongoDB ObjectId,
 * e.g. GET /api/products/abc  ->  404 "Product not found".
 * Used with router.param('id', validateObjectId('Product')).
 */
const validateObjectId = (resourceName = 'Resource') => (req, _res, next, id) => {
  if (!isObjectId(id)) {
    throw new ApiError(404, `${resourceName} not found`);
  }
  next();
};

export default validateObjectId;
