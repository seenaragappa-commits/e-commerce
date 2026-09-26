import Product from '../models/Product.js';
import ApiError from '../utils/ApiError.js';
import { LOW_STOCK_THRESHOLD, PRODUCT_CATEGORIES } from '../utils/constants.js';
import { asString, escapeRegex, pickOption, roundMoney, toBoundedInt } from '../utils/helpers.js';
import { firstError, hasErrors, validateProductInput } from '../utils/validators.js';

// ?sort=<key> options for the catalog. _id is a tie-breaker so paging is stable.
const SORT_OPTIONS = {
  newest: { createdAt: -1, _id: -1 },
  'price-asc': { price: 1, _id: 1 },
  'price-desc': { price: -1, _id: 1 },
  rating: { rating: -1, numReviews: -1, _id: 1 },
  name: { name: 1, _id: 1 },
  'stock-asc': { stock: 1, name: 1, _id: 1 },
};

// ?stock=<key> inventory filters (used by the admin product list).
const STOCK_FILTERS = {
  in: { $gt: 0 },
  low: { $gt: 0, $lte: LOW_STOCK_THRESHOLD },
  out: { $lte: 0 },
};

// Only these fields can be set by an admin. The number of reviews is not editable.
const EDITABLE_FIELDS = ['name', 'description', 'price', 'category', 'image', 'stock', 'rating', 'isFeatured'];

const pickProductFields = (body = {}) => {
  const data = {};
  for (const field of EDITABLE_FIELDS) {
    if (body[field] !== undefined) data[field] = body[field];
  }
  return data;
};

const normalizeProductFields = (data) => {
  const normalized = { ...data };
  for (const field of ['name', 'description', 'image']) {
    if (typeof normalized[field] === 'string') normalized[field] = normalized[field].trim();
  }
  if (normalized.price !== undefined) normalized.price = roundMoney(normalized.price);
  if (normalized.stock !== undefined) normalized.stock = Number(normalized.stock);
  if (normalized.rating !== undefined) normalized.rating = Math.round(Number(normalized.rating) * 10) / 10;
  return normalized;
};

/**
 * List products with search, filters, sorting and pagination.
 * @route   GET /api/products
 * @query   keyword, category, minPrice, maxPrice, inStock=true, stock=in|low|out, featured=true,
 *          sort=newest|price-asc|price-desc|rating|name|stock-asc, page, limit
 * @access  Public
 */
export const getProducts = async (req, res) => {
  const keyword = asString(req.query.keyword);
  const category = asString(req.query.category);
  const minPrice = Number.parseFloat(asString(req.query.minPrice));
  const maxPrice = Number.parseFloat(asString(req.query.maxPrice));
  const sortKey = asString(req.query.sort);
  const page = toBoundedInt(req.query.page, 1, 1, 10000);
  const limit = toBoundedInt(req.query.limit, 12, 1, 50);

  const filter = {};

  if (keyword) {
    // Case-insensitive "contains" search on name, description and category.
    const regex = new RegExp(escapeRegex(keyword.slice(0, 100)), 'i');
    filter.$or = [{ name: regex }, { description: regex }, { category: regex }];
  }

  if (category && category !== 'All') {
    filter.category = category;
  }

  if (!Number.isNaN(minPrice) || !Number.isNaN(maxPrice)) {
    filter.price = {};
    if (!Number.isNaN(minPrice)) filter.price.$gte = minPrice;
    if (!Number.isNaN(maxPrice)) filter.price.$lte = maxPrice;
  }

  if (req.query.inStock === 'true') filter.stock = STOCK_FILTERS.in;
  const stockFilter = pickOption(STOCK_FILTERS, asString(req.query.stock));
  if (stockFilter) filter.stock = stockFilter;
  if (req.query.featured === 'true') filter.isFeatured = true;

  const sort = pickOption(SORT_OPTIONS, sortKey) || SORT_OPTIONS.newest;

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit),
    Product.countDocuments(filter),
  ]);

  res.json({
    products,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
    total,
  });
};

/**
 * Categories with the number of products in each (used by the home page and filters).
 * @route   GET /api/products/categories
 * @access  Public
 */
export const getCategories = async (_req, res) => {
  const counts = await Product.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]);
  const countByCategory = Object.fromEntries(counts.map((item) => [item._id, item.count]));

  res.json(PRODUCT_CATEGORIES.map((name) => ({ name, count: countByCategory[name] || 0 })));
};

/**
 * @route   GET /api/products/:id
 * @access  Public
 */
export const getProductById = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }
  res.json(product);
};

/**
 * @route   POST /api/products
 * @access  Private/Admin
 */
export const createProduct = async (req, res) => {
  const data = pickProductFields(req.body);
  const errors = validateProductInput(data);
  if (hasErrors(errors)) {
    throw new ApiError(400, firstError(errors), errors);
  }

  const product = await Product.create(normalizeProductFields(data));
  res.status(201).json(product);
};

/**
 * @route   PUT /api/products/:id
 * @access  Private/Admin
 */
export const updateProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  const data = pickProductFields(req.body);
  const errors = validateProductInput(data, { partial: true });
  if (hasErrors(errors)) {
    throw new ApiError(400, firstError(errors), errors);
  }

  Object.assign(product, normalizeProductFields(data));
  const updatedProduct = await product.save();
  res.json(updatedProduct);
};

/**
 * Existing orders are not affected: they keep their own copy of the product details.
 * @route   DELETE /api/products/:id
 * @access  Private/Admin
 */
export const deleteProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  await product.deleteOne();
  res.json({ message: `"${product.name}" was deleted`, id: product._id });
};
