import { supabase } from '../lib/supabase.js';
import { logger } from '../utils/logger.js';
import { Order, OrderStats } from '../types/order.js';

export class OrderService {
  async getSellerOrders(sellerId: string): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error(`Error fetching orders for seller ${sellerId}`, error);
      throw error;
    }

    return data || [];
  }

  async getBuyerOrders(buyerId: string): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('buyer_id', buyerId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error(`Error fetching orders for buyer ${buyerId}`, error);
      throw error;
    }

    return data || [];
  }

  async getSellerStats(sellerId: string): Promise<OrderStats> {
    try {
      // Fetch product count
      const { count: productsCount, error: pError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', sellerId);

      if (pError) throw pError;

      // Fetch order stats
      const { data: orders, error: oError } = await supabase
        .from('orders')
        .select('total_amount, status')
        .eq('seller_id', sellerId);

      if (oError) throw oError;

      const revenue = orders?.reduce((acc, order) => acc + Number(order.total_amount), 0) || 0;
      const ordersCount = orders?.length || 0;
      const pendingOrdersCount = orders?.filter(o => o.status === 'PENDING').length || 0;

      return {
        productsCount: productsCount || 0,
        ordersCount,
        revenue,
        pendingOrdersCount
      };
    } catch (error) {
      logger.error(`Error calculating stats for seller ${sellerId}`, error);
      throw error;
    }
  }

  async getBuyerStats(buyerId: string): Promise<OrderStats> {
    try {
      const { data: orders, error: oError } = await supabase
        .from('orders')
        .select('total_amount, status')
        .eq('buyer_id', buyerId);

      if (oError) throw oError;

      const totalSpent = orders?.reduce((acc, order) => acc + Number(order.total_amount), 0) || 0;
      const ordersCount = orders?.length || 0;
      const pendingOrdersCount = orders?.filter(o => o.status === 'PENDING').length || 0;

      return {
        productsCount: 0,
        ordersCount,
        revenue: totalSpent,
        pendingOrdersCount
      };
    } catch (error) {
      logger.error(`Error calculating stats for buyer ${buyerId}`, error);
      throw error;
    }
  }

  async updateOrderStatus(orderId: string, status: string): Promise<Order> {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      logger.error(`Error updating order status for order ${orderId}`, error);
      throw error;
    }

    return data;
  }
}

export const orderService = new OrderService();
