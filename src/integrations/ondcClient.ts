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
    // Ensure baseURL DOES NOT end with a slash and paths START with one
    const normalizedBaseUrl = MOCK_SERVICE_URL.endsWith('/') ? MOCK_SERVICE_URL.slice(0, -1) : MOCK_SERVICE_URL;

    this.client = axios.create({
      baseURL: normalizedBaseUrl,
      timeout: 60000, // Increased to 60s for cold starts
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': MOCK_API_KEY,
      },
    });
  }

  async checkHealth(retries = 2) {
    for (let i = 0; i <= retries; i++) {
      try {
        if (i > 0) logger.info(`Retrying ONDC health check (Attempt ${i + 1}/${retries + 1})...`);
        logger.info(`Checking ONDC Mock Server health at: ${MOCK_SERVICE_URL}/health`);
        const response = await this.client.get('/health');
        logger.info('ONDC Mock Server Connectivity: SUCCESS', { 
          status: response.data?.status || 'OK',
          url: `${MOCK_SERVICE_URL}/health`
        });
        return true;
      } catch (error: any) {
        if (i === retries) {
          logger.error(`ONDC Mock Server Connectivity: FAILED after ${retries + 1} attempts at ${MOCK_SERVICE_URL}/health`, { 
            error: error.message,
            code: error.code
          });
          return false;
        }
        // Wait 2 seconds before retry
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    return false;
  }

  async startFlow(flowId: string, sessionId: string) {
    try {
      const transaction_id = randomUUID();
      logger.info(`Starting ONDC flow: ${flowId} for session: ${sessionId}, transaction_id: ${transaction_id}`);
      
      // Step 1: Initialize the session in the Mock Server's cache
      try {
        await this.client.post(`${ONDC_BASE_PATH}/flows/init-session`, {
          session_id: sessionId,
          domain: 'ONDC:AGR10',
          version: '2.0.0',
          np_type: 'BAP',
        });
        logger.info(`Session initialized for session: ${sessionId}`);
      } catch (initError: any) {
        logger.warn(`Session init returned error (may already exist): ${initError.message}`);
        // Continue even if init fails - session may already exist
      }

      // Step 2: Create the flow
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
