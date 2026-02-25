import dotenv from 'dotenv';
import { logger } from './logger.js';

dotenv.config();

const requiredEnv = [
  'SUPABASE_URL',
  'SUPABASE_KEY'
];

export const validateEnv = () => {
  const missing = requiredEnv.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    logger.warn(`Missing environment variables: ${missing.join(', ')} — some features may not work`);
  }
};

// Log warnings but don't exit (MVP — graceful degradation)

const getMockUrl = () => {
  const url = process.env.MOCK_SERVICE_URL || 'https://ondc-mock-server.onrender.com';
  return url.startsWith('http') ? url : `https://${url}`;
};

export const config = {
  port: process.env.PORT || 3000,
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseKey: process.env.SUPABASE_KEY || '',
  mockServiceUrl: getMockUrl(),
  mockOndcPath: '/mock/playground',
  mockApiKey: process.env.MOCK_API_KEY || '',
  nodeEnv: process.env.NODE_ENV || 'development'
};
