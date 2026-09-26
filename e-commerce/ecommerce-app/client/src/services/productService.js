import api, { cleanParams } from './api';

/**
 * @param {object} params keyword, category, minPrice, maxPrice, inStock, featured, sort, page, limit
 * @returns {Promise<{ products, page, pages, total }>}
 */
export const getProducts = async (params = {}) => {
  const { data } = await api.get('/products', { params: cleanParams(params) });
  return data;
};

export const getProduct = async (id) => {
  const { data } = await api.get(`/products/${id}`);
  return data;
};

/** @returns {Promise<Array<{ name, count }>>} */
export const getCategories = async () => {
  const { data } = await api.get('/products/categories');
  return data;
};

// ----- Admin only -----

export const createProduct = async (product) => {
  const { data } = await api.post('/products', product);
  return data;
};

export const updateProduct = async (id, changes) => {
  const { data } = await api.put(`/products/${id}`, changes);
  return data;
};

export const deleteProduct = async (id) => {
  const { data } = await api.delete(`/products/${id}`);
  return data;
};
