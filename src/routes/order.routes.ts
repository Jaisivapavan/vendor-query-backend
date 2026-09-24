import { Router } from 'express';
import { OrderController, createOrderSchema } from '../controllers/order.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';

const router = Router();

// Protect all order routes with JWT auth
router.use(authMiddleware);

router.post('/', validateRequest(createOrderSchema), OrderController.createOrder);
router.get('/', OrderController.getOrders);
router.get('/:id', OrderController.getOrderById);

export default router;
