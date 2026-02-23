import { z } from 'zod';

export const TransactionSchema = z.object({
  id: z.string().uuid().optional(),
  transaction_id: z.string(),
  session_id: z.string(),
  flow_id: z.string(),
  status: z.string(),
  created_at: z.string().datetime().optional(),
});

export type Transaction = z.infer<typeof TransactionSchema>;

export const SearchRequestSchema = z.object({
  sessionId: z.string(),
  flowId: z.string(),
});

export const FlowProceedSchema = z.object({
  transactionId: z.string(),
  inputs: z.record(z.any()).optional(),
});

export const ManualActionSchema = z.object({
  action: z.string(),
  payload: z.record(z.any()),
});
