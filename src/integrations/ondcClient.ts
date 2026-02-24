import axios, { AxiosInstance } from 'axios';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';
import { logger } from '../utils/logger.js';

import { config } from '../utils/config.js';

const MOCK_SERVICE_URL = config.mockServiceUrl;
const MOCK_API_KEY = config.mockApiKey;
const ONDC_BASE_PATH = config.mockOndcPath;

class OndcClient {
  private client: AxiosInstance;

  constructor() {
    // Ensure baseURL ends with a slash for proper path joining
    const normalizedBaseUrl = MOCK_SERVICE_URL.endsWith('/') ? MOCK_SERVICE_URL : `${MOCK_SERVICE_URL}/`;

    this.client = axios.create({
      baseURL: normalizedBaseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': MOCK_API_KEY,
      },
    });
  }

  async checkHealth() {
    try {
      logger.info(`Checking ONDC Mock Server health at: ${MOCK_SERVICE_URL}/health`);
      const response = await this.client.get('health');
      logger.info('ONDC Mock Server Connectivity: SUCCESS', { 
        status: response.data?.status || 'OK',
        url: `${MOCK_SERVICE_URL}/health`
      });
      return true;
    } catch (error: any) {
      logger.error(`ONDC Mock Server Connectivity: FAILED at ${MOCK_SERVICE_URL}/health`, { 
        error: error.message,
        code: error.code
      });
      return false;
    }
  }

  async startFlow(flowId: string, sessionId: string) {
    try {
      const transaction_id = randomUUID();
      logger.info(`Starting ONDC flow: ${flowId} for session: ${sessionId}, transaction_id: ${transaction_id}`);
      const response = await this.client.post(`${ONDC_BASE_PATH}/flows/new`, {
        flow_id: flowId,
        session_id: sessionId,
        transaction_id,
      });
      // Ensure we return the transactionId to the service
      return { ...response.data, transactionId: transaction_id };
    } catch (error: any) {
      this.handleError(error, 'startFlow');
    }
  }

  async proceedFlow(transactionId: string, sessionId: string, inputs?: object) {
    try {
      logger.info(`Proceeding ONDC flow for transaction: ${transactionId} (session: ${sessionId})`, { inputs });
      const response = await this.client.post(`${ONDC_BASE_PATH}/flows/proceed`, {
        transaction_id: transactionId,
        session_id: sessionId,
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
      const response = await this.client.post(`${ONDC_BASE_PATH}/action/trigger`, {
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
