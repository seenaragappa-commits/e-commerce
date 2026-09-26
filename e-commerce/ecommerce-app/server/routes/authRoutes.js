import { Router } from 'express';
import { getMe, loginUser, registerUser, updateProfile } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { checkLoginAttempts } from '../middleware/loginLimiter.js';

const router = Router();

router.post('/register', registerUser);
router.post('/login', checkLoginAttempts, loginUser);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

export default router;
