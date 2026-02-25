import { supabase } from '../lib/supabase.js';
import { ondcClient } from '../integrations/ondcClient.js';
import { logger } from '../utils/logger.js';
import { Transaction } from '../types/transaction.js';
import { config } from '../utils/config.js';

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

    if (result.status === 'CONFIRMED' || result.status === 'SUCCESS' || !result.error) {
      const orderItems = inputs?.items || [];

      // Step 1: Decrement stock for each item FIRST
      const decrementedItems: Array<{ id: string; quantity: number }> = [];

      for (const item of orderItems) {
        if (!item.id || !item.quantity) continue;

        // Fetch current stock
        const { data: product } = await supabase
          .from('products')
          .select('stock_quantity')
          .eq('id', item.id)
          .single();

        if (!product || product.stock_quantity < item.quantity) {
          // Insufficient stock — rollback already decremented items
          await this.rollbackStock(decrementedItems);
          logger.error(`Insufficient stock for product ${item.id}: have ${product?.stock_quantity ?? 0}, need ${item.quantity}`);
          throw new Error(`Insufficient stock for item: ${item.id}`);
        }

        // Decrement with optimistic concurrency (check current value hasn't changed)
        const newQty = product.stock_quantity - item.quantity;
        const { error: updateError } = await supabase
          .from('products')
          .update({ stock_quantity: newQty })
          .eq('id', item.id)
          .eq('stock_quantity', product.stock_quantity);

        if (updateError) {
          await this.rollbackStock(decrementedItems);
          logger.error(`Failed to decrement stock for product ${item.id}`, updateError);
          throw new Error(`Stock update failed for item: ${item.id}`);
        }

        decrementedItems.push({ id: item.id, quantity: item.quantity });
      }

      // Step 2: Insert order only after all stock decremented
      try {
        const orderData = {
          customer_name: inputs?.customer_name || 'Buyer',
          total_amount: inputs?.total_amount || 0,
          seller_id: inputs?.seller_id || 'unknown_seller',
          buyer_id: inputs?.buyer_id || 'buyer_default',
          items: orderItems,
          status: 'PENDING',
        };

        const { error: orderError } = await supabase.from('orders').insert([orderData]);
        if (orderError) {
          // Step 3: Compensate — re-increment stock if order insert fails
          logger.error('Order insert failed, rolling back stock decrements', orderError);
          await this.rollbackStock(decrementedItems);
          throw orderError;
        }
        logger.info(`Order recorded for transaction: ${transactionId}`);
      } catch (err) {
        logger.error('Error in post-confirmation order recording', err);
        throw err;
      }
    }

    return result;
  }

  /** Best-effort stock rollback for compensation */
  private async rollbackStock(items: Array<{ id: string; quantity: number }>) {
    for (const dec of items) {
      try {
        const { data: current } = await supabase
          .from('products')
          .select('stock_quantity')
          .eq('id', dec.id)
          .single();
        if (current) {
          await supabase
            .from('products')
            .update({ stock_quantity: current.stock_quantity + dec.quantity })
            .eq('id', dec.id);
        }
      } catch (e) {
        logger.error(`Failed to rollback stock for product ${dec.id}`, e);
      }
    }
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
