import { Router } from 'express';
import { transactionController } from '../controllers/transactionController.js';
import { productController } from '../controllers/productController.js';
import { orderController } from '../controllers/orderController.js';

const router = Router();

// Health endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'bharatmandi-backend'
  });
});

// Checkout flow creation (backend owns session/flow IDs)
router.post('/api/checkout/create-flow', transactionController.createFlow);

// ONDC Flow routes
router.post('/api/search', transactionController.search);
router.post('/api/select', transactionController.select);
router.post('/api/init', transactionController.init);
router.post('/api/confirm', transactionController.confirm);
router.get('/api/status/:transactionId', transactionController.getStatus);

// Product routes
router.post('/api/products', productController.addProduct);
router.get('/api/products', productController.getAllProducts);
router.get('/api/products/feed', productController.getFeed);
router.get('/api/products/search', productController.searchProducts);
router.get('/api/products/seller/:sellerId', productController.getSellerProducts);

// Order and Stats routes
router.get('/api/orders/seller/:sellerId', orderController.getSellerOrders);
router.patch('/api/orders/:id/status', orderController.updateOrderStatus);
router.get('/api/stats/seller/:sellerId', orderController.getSellerStats);

export default router;
