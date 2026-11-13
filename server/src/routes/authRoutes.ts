import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { login, logout, me, refresh } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication requests. Please wait a few minutes.' },
});

router.post('/login', authLimiter, login);
router.post('/refresh', authLimiter, refresh);
router.get('/me', requireAuth, me);
router.post('/logout', requireAuth, logout);

export default router;
