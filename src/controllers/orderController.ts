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

  async updateOrderStatus(req: Request, res: Response) {
    try {
      const orderId = req.params.id as string;
      const { status } = req.body;

      if (!orderId || !status) {
        return res.status(400).json({ error: 'Missing orderId or status' });
      }

      // Basic validation of valid statuses
      const validStatuses = ['PENDING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status provided' });
      }

      const order = await orderService.updateOrderStatus(orderId, status);
      res.json(order);
    } catch (error) {
      logger.error('Controller error in updateOrderStatus:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getBuyerOrders(req: Request, res: Response) {
    try {
      const buyerId = req.params.buyerId as string;
      if (!buyerId) {
        return res.status(400).json({ error: 'Missing buyerId' });
      }

      const orders = await orderService.getBuyerOrders(buyerId);
      res.json(orders);
    } catch (error) {
      logger.error('Controller error in getBuyerOrders:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getBuyerStats(req: Request, res: Response) {
    try {
      const buyerId = req.params.buyerId as string;
      if (!buyerId) {
        return res.status(400).json({ error: 'Missing buyerId' });
      }

      const stats = await orderService.getBuyerStats(buyerId);
      res.json(stats);
    } catch (error) {
      logger.error('Controller error in getBuyerStats:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export const orderController = new OrderController();
