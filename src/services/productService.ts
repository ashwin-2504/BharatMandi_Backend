import { supabase } from '../lib/supabase.js';
import { logger } from '../utils/logger.js';
import { Product, CreateProductInput } from '../types/product.js';

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
    // Sanitize query: strip Supabase/SQL wildcards
    const sanitized = query.replace(/[%_]/g, '');
    if (!sanitized) return [];

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .or(`name.ilike.%${sanitized}%,category.ilike.%${sanitized}%,description.ilike.%${sanitized}%`)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error(`Error searching products with query ${sanitized}`, error);
      throw error;
    }

    return data || [];
  }

  async getFeed(limit: number = 10): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Error fetching product feed', error);
      throw error;
    }

    return data || [];
  }

  async updateProduct(id: string, sellerId: string, updateData: Partial<CreateProductInput>): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .eq('seller_id', sellerId)  // Ownership guard
      .select()
      .single();

    if (error) {
      logger.error(`Error updating product ${id}`, error);
      throw error;
    }

    return data;
  }

  async deleteProduct(id: string, sellerId: string): Promise<void> {
    const { error, count } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
      .eq('seller_id', sellerId);  // Ownership guard

    if (error) {
      logger.error(`Error deleting product ${id}`, error);
      throw error;
    }
  }
}

export const productService = new ProductService();

