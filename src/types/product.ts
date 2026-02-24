export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  stock_quantity: number;
  image_url?: string;
  seller_id: string;
  created_at?: string;
  updated_at?: string;
}

export type CreateProductInput = Omit<Product, 'id' | 'created_at' | 'updated_at'>;
