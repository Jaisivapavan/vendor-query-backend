import { Router } from 'express';
import { ChatController, chatMessageSchema } from '../controllers/chat.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { rateLimiter } from '../middleware/rateLimiter';
import { validateRequest } from '../middleware/validate.middleware';

const router = Router();

// Protect chat endpoint with JWT authentication, tenant isolation, and sliding-window rate limit
router.post(
  '/stream',
  authMiddleware,
  rateLimiter(10, 60), // Max 10 queries per minute per vendor to protect Gemini quota
  validateRequest(chatMessageSchema),
  ChatController.streamChat
);

export default router;
