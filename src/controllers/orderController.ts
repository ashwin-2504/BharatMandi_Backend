import { Request, Response } from 'express';
import { orderService } from '../services/orderService.js';
import { logger } from '../utils/logger.js';

export class OrderController {
  async getSellerOrders(req: Request, res: Response) {
    try {
      const sellerId = req.params.sellerId as string;
      if (!sellerId) {
        return res.status(400).json({ error: 'Missing sellerId' });
      }

      const orders = await orderService.getSellerOrders(sellerId);
      res.json(orders);
    } catch (error) {
      logger.error('Controller error in getSellerOrders:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getSellerStats(req: Request, res: Response) {
    try {
      const sellerId = req.params.sellerId as string;
      if (!sellerId) {
        return res.status(400).json({ error: 'Missing sellerId' });
      }

      const stats = await orderService.getSellerStats(sellerId);
      res.json(stats);
    } catch (error) {
      logger.error('Controller error in getSellerStats:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export const orderController = new OrderController();
