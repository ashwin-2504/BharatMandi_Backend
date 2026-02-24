import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger.js';
import { config } from '../utils/config.js';
import { Product, CreateProductInput } from '../types/product.js';

const supabase = createClient(config.supabaseUrl, config.supabaseKey);

export class ProductService {
  async addProduct(productData: CreateProductInput): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .insert([productData])
      .select()
      .single();

    if (error) {
      logger.error('Error adding product to Supabase', error);
      throw error;
    }

    return data;
  }

  async getSellerProducts(sellerId: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error(`Error fetching products for seller ${sellerId}`, error);
      throw error;
    }

    return data || [];
  }

  async getAllProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching all products', error);
      throw error;
    }

    return data || [];
  }

  async searchProducts(query: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .or(`name.ilike.%${query}%,category.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error(`Error searching products with query ${query}`, error);
      throw error;
    }

    return data || [];
  }
}

export const productService = new ProductService();
