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
}

export const productController = new ProductController();
