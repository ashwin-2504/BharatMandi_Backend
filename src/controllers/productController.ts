import { Request, Response } from 'express';
import { productService } from '../services/productService.js';
import { logger } from '../utils/logger.js';

export class ProductController {
  async addProduct(req: Request, res: Response) {
    try {
      const productData = req.body;
      
      // Basic validation
      if (!productData.name || !productData.price || !productData.seller_id) {
        return res.status(400).json({ error: 'Missing required fields (name, price, seller_id)' });
      }

      const product = await productService.addProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      logger.error('Controller error in addProduct:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getSellerProducts(req: Request, res: Response) {
    try {
      const sellerId = req.params.sellerId as string;
      
      if (!sellerId) {
        return res.status(400).json({ error: 'Missing sellerId parameter' });
      }

      const products = await productService.getSellerProducts(sellerId);
      res.json(products);
    } catch (error) {
      logger.error('Controller error in getSellerProducts:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getAllProducts(req: Request, res: Response) {
    try {
      const products = await productService.getAllProducts();
      res.json(products);
    } catch (error) {
      logger.error('Controller error in getAllProducts:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async searchProducts(req: Request, res: Response) {
    try {
      const query = req.query.q as string;
      
      if (!query) {
        return res.status(400).json({ error: 'Missing query parameter q' });
      }

      const products = await productService.searchProducts(query);
      res.json(products);
    } catch (error) {
      logger.error('Controller error in searchProducts:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getFeed(req: Request, res: Response) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const products = await productService.getFeed(limit);
      res.json(products);
    } catch (error) {
      logger.error('Controller error in getFeed:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateProduct(req: Request, res: Response) {
    try {
      const productId = req.params.id as string;
      const sellerId = req.body.seller_id as string;
      const updateData = req.body;

      if (!productId || !sellerId) {
        return res.status(400).json({ error: 'Missing productId or seller_id' });
      }

      // Remove seller_id from update payload (not updatable)
      delete updateData.seller_id;

      const product = await productService.updateProduct(productId, sellerId, updateData);
      res.json(product);
    } catch (error) {
      logger.error('Controller error in updateProduct:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async deleteProduct(req: Request, res: Response) {
    try {
      const productId = req.params.id as string;
      const sellerId = req.query.seller_id as string;

      if (!productId || !sellerId) {
        return res.status(400).json({ error: 'Missing productId or seller_id' });
      }

      await productService.deleteProduct(productId, sellerId);
      res.json({ success: true, message: 'Product deleted' });
    } catch (error) {
      logger.error('Controller error in deleteProduct:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export const productController = new ProductController();
