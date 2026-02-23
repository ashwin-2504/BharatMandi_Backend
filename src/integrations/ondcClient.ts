import axios, { AxiosInstance } from 'axios';
import dotenv from 'dotenv';
import { logger } from '../utils/logger.js';

import { config } from '../utils/config.js';

const MOCK_SERVICE_URL = config.mockServiceUrl;
const MOCK_API_KEY = config.mockApiKey;

class OndcClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: MOCK_SERVICE_URL,
      timeout: 8000,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': MOCK_API_KEY,
      },
    });
  }

  async startFlow(flowId: string, sessionId: string) {
    try {
      logger.info(`Starting ONDC flow: ${flowId} for session: ${sessionId}`);
      const response = await this.client.post('/flow/start', {
        flowId,
        sessionId,
      });
      return response.data;
    } catch (error: any) {
      this.handleError(error, 'startFlow');
    }
  }

  async proceedFlow(transactionId: string, inputs?: object) {
    try {
      logger.info(`Proceeding ONDC flow for transaction: ${transactionId}`, { inputs });
      const response = await this.client.post('/flow/proceed', {
        transactionId,
        inputs,
      });
      return response.data;
    } catch (error: any) {
      this.handleError(error, 'proceedFlow');
    }
  }

  async triggerManualAction(action: string, payload: object) {
    try {
      logger.info(`Triggering manual action: ${action}`, { payload });
      const response = await this.client.post('/action/trigger', {
        action,
        payload,
      });
      return response.data;
    } catch (error: any) {
      this.handleError(error, 'triggerManualAction');
    }
  }

  private handleError(error: any, context: string) {
    const message = error.response?.data?.message || error.message;
    const status = error.response?.status || 500;
    logger.error(`ONDC Client Error in ${context}: ${message}`, error);
    
    const err: any = new Error(message);
    err.status = status;
    err.code = 'ONDC_CLIENT_ERROR';
    throw err;
  }
}

export const ondcClient = new OndcClient();
