import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('Product API Integration Tests', () => {
  const mockProduct = {
    name: 'Test Product',
    description: 'This is a test product',
    price: 99.99,
    category: 'Test',
    stock_quantity: 10,
    seller_id: 'seller_test_123',
    image_url: 'https://example.com/test.jpg'
  };

  it('should create a new product', async () => {
    const response = await request(app)
      .post('/api/products')
      .send(mockProduct);

    expect(response.status).toBe(201);
    expect(response.body.name).toBe(mockProduct.name);
    expect(response.body.seller_id).toBe(mockProduct.seller_id);
    expect(response.body.id).toBeDefined();
  });

  it('should fetch products for a seller', async () => {
    const response = await request(app)
      .get(`/api/products/seller/${mockProduct.seller_id}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
  });

  it('should fetch all products', async () => {
    const response = await request(app)
      .get('/api/products');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('should return 400 for missing required fields', async () => {
    const invalidProduct = { name: 'Incomplete' };
    const response = await request(app)
      .post('/api/products')
      .send(invalidProduct);

    expect(response.status).toBe(400);
  });
});
