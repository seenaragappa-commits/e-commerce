import { Router } from 'express';
import {
  createProduct,
  deleteProduct,
  getCategories,
  getProductById,
  getProducts,
  updateProduct,
} from '../controllers/productController.js';
import { admin, protect } from '../middleware/authMiddleware.js';
import validateObjectId from '../middleware/validateObjectId.js';

const router = Router();

router.param('id', validateObjectId('Product'));

// Public: anyone can browse the catalog. Admin only: create / update / delete.
router.route('/').get(getProducts).post(protect, admin, createProduct);
router.get('/categories', getCategories);
router.route('/:id').get(getProductById).put(protect, admin, updateProduct).delete(protect, admin, deleteProduct);

export default router;
