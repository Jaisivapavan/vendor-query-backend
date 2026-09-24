import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Protect all report routes with JWT auth & tenant isolation
router.use(authMiddleware);

router.get('/top-items', ReportController.getTopItems);
router.get('/revenue', ReportController.getRevenue);
router.get('/payment-split', ReportController.getPaymentSplit);

export default router;
