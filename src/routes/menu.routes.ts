import { Router } from 'express';
import {
  MenuController,
  createCategorySchema,
  createMenuItemSchema,
  updateMenuItemSchema,
} from '../controllers/menu.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';

const router = Router();

// Protect all menu routes with JWT auth
router.use(authMiddleware);

// Categories
router.post('/categories', validateRequest(createCategorySchema), MenuController.createCategory);
router.get('/categories', MenuController.getCategories);

// Menu items
router.post('/items', validateRequest(createMenuItemSchema), MenuController.createMenuItem);
router.get('/items', MenuController.getMenuItems);
router.patch('/items/:id', validateRequest(updateMenuItemSchema), MenuController.updateMenuItem);

export default router;
