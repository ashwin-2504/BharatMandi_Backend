import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { ondcClient } from '../integrations/ondcClient.js';
import { logger } from '../utils/logger.js';
import { Transaction } from '../types/transaction.js';

import { config } from '../utils/config.js';

const SUPABASE_URL = config.supabaseUrl;
const SUPABASE_KEY = config.supabaseKey;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export class TransactionService {
  /**
   * Creates a new checkout flow. The backend owns session/flow creation
   * so the Native app never generates dynamic IDs itself.
   */
  async createFlow(usecaseId: string = 'agricultural_flow_1') {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const flowId = usecaseId;

    logger.info(`Creating checkout flow: session=${sessionId}, flow=${flowId}`);

    const result = await ondcClient.startFlow(flowId, sessionId);

    const transactionData: Partial<Transaction> = {
      transaction_id: result.transactionId,
      session_id: sessionId,
      flow_id: flowId,
      status: result.status || 'INITIATED',
    };

    await this.saveTransaction(transactionData);

    return {
      sessionId,
      flowId,
      transactionId: result.transactionId,
      status: result.status || 'INITIATED',
    };
  }

  async search(sessionId: string, flowId: string) {
    // Idempotency check: return existing transaction if session+flow pair exists
    const { data: existing } = await supabase
      .from('transactions')
      .select('*')
      .eq('session_id', sessionId)
      .eq('flow_id', flowId)
      .single();

    if (existing) {
      logger.info(`Returning existing transaction for session: ${sessionId}, flow: ${flowId}`, {
        transactionId: existing.transaction_id
      });
      return {
        transactionId: existing.transaction_id,
        status: existing.status,
        fromCache: true
      };
    }

    const result = await ondcClient.startFlow(flowId, sessionId);
    
    const transactionData: Partial<Transaction> = {
      transaction_id: result.transactionId,
      session_id: sessionId,
      flow_id: flowId,
      status: result.status || 'INITIATED',
    };

    await this.saveTransaction(transactionData);
    
    return result;
  }

  async select(transactionId: string, inputs?: object) {
    const sessionId = await this.getSessionId(transactionId);
    const result = await ondcClient.proceedFlow(transactionId, sessionId, inputs);
    await this.updateTransactionStatus(transactionId, result.status || 'SELECTED');
    return result;
  }

  async init(transactionId: string, inputs?: object) {
    const sessionId = await this.getSessionId(transactionId);
    const result = await ondcClient.proceedFlow(transactionId, sessionId, inputs);
    await this.updateTransactionStatus(transactionId, result.status || 'INITIALIZED');
    return result;
  }

  async confirm(transactionId: string, inputs?: any) {
    const sessionId = await this.getSessionId(transactionId);
    const result = await ondcClient.proceedFlow(transactionId, sessionId, inputs);
    await this.updateTransactionStatus(transactionId, result.status || 'CONFIRMED');

    // Record order in 'orders' table if confirmation is successful
    if (result.status === 'CONFIRMED' || result.status === 'SUCCESS' || !result.error) {
      try {
        const orderData = {
          customer_name: inputs?.customer_name || 'Buyer',
          total_amount: inputs?.total_amount || 0,
          seller_id: inputs?.seller_id || 'unknown_seller',
          buyer_id: inputs?.buyer_id || 'buyer_default',
          items: inputs?.items || [],
          status: 'PENDING',
        };

        const { error } = await supabase.from('orders').insert([orderData]);
        if (error) logger.error('Error recording order after confirmation', error);
        else logger.info(`Order recorded for transaction: ${transactionId}`);
      } catch (err) {
        logger.error('Error in post-confirmation order recording', err);
      }
    }

    return result;
  }

  async getStatus(transactionId: string) {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('transaction_id', transactionId)
      .single();

    if (error) {
      logger.error(`Error fetching transaction status for ${transactionId}`, error);
      throw error;
    }

    return data;
  }

  private async getSessionId(transactionId: string): Promise<string> {
    const { data, error } = await supabase
      .from('transactions')
      .select('session_id')
      .eq('transaction_id', transactionId)
      .single();

    if (error || !data) {
      logger.error(`Could not find session_id for transaction: ${transactionId}`, error);
      throw new Error(`Transaction session not found: ${transactionId}`);
    }

    return data.session_id;
  }

  private async saveTransaction(data: Partial<Transaction>) {
    const { error } = await supabase
      .from('transactions')
      .insert(data);

    if (error) {
      logger.error('Error saving transaction to Supabase', error);
      // We don't throw here to avoid failing the whole flow if persistence fails
    }
  }

  private async updateTransactionStatus(transactionId: string, status: string) {
    const { error } = await supabase
      .from('transactions')
      .update({ status })
      .eq('transaction_id', transactionId);

    if (error) {
      logger.error(`Error updating transaction status for ${transactionId}`, error);
    }
  }
}

export const transactionService = new TransactionService();
