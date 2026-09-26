import { Router } from 'express';
import { cancelMyOrder, createOrder, getMyOrders, getOrderById } from '../controllers/orderController.js';
import { protect } from '../middleware/authMiddleware.js';
import validateObjectId from '../middleware/validateObjectId.js';

const router = Router();

router.param('id', validateObjectId('Order'));

// Every order route requires a logged-in user. The user id always comes from the
// verified token (req.user) - never from the request body.
// Admin order management lives under /api/admin/orders (see adminRoutes.js).
router.use(protect);

router.post('/', createOrder);
router.get('/myorders', getMyOrders);
router.get('/:id', getOrderById);
router.put('/:id/cancel', cancelMyOrder);

export default router;
