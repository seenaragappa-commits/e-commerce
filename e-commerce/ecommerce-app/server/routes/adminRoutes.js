import { Router } from 'express';
import { getDashboardStats, getUsers } from '../controllers/adminController.js';
import { getOrderById, getOrders, updateOrderStatus } from '../controllers/adminOrderController.js';
import { admin, protect } from '../middleware/authMiddleware.js';
import validateObjectId from '../middleware/validateObjectId.js';

const router = Router();

router.param('id', validateObjectId('Order'));

// Every route in this file is for admins only:
// `protect` checks the JWT (401 if missing/invalid), `admin` checks the role stored in MongoDB (403 otherwise).
router.use(protect, admin);

router.get('/stats', getDashboardStats);
router.get('/users', getUsers);

router.get('/orders', getOrders);
router.get('/orders/:id', getOrderById);
router.put('/orders/:id/status', updateOrderStatus);

export default router;
