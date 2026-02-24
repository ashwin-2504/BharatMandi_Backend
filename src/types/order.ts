export interface Order {
  id: string;
  customer_name: string;
  total_amount: number;
  status: 'PENDING' | 'ACCEPTED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  seller_id: string;
  items: any[];
  created_at: string;
  updated_at: string;
}

export interface OrderStats {
  productsCount: number;
  ordersCount: number;
  revenue: number;
  pendingOrdersCount: number;
}
