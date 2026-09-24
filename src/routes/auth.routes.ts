import { Router } from 'express';
import { AuthController, registerSchema, loginSchema } from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validate.middleware';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', validateRequest(registerSchema), AuthController.register);
router.post('/login', validateRequest(loginSchema), AuthController.login);
router.get('/profile', authMiddleware, AuthController.getProfile);

export default router;
