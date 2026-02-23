import { Router } from 'express';
import { transactionController } from '../controllers/transactionController.js';

const router = Router();

// Health endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'bharatmandi-backend'
  });
});

// ONDC Flow routes
router.post('/api/search', transactionController.search);
router.post('/api/select', transactionController.select);
router.post('/api/init', transactionController.init);
router.post('/api/confirm', transactionController.confirm);
router.get('/api/status/:transactionId', transactionController.getStatus);

export default router;
