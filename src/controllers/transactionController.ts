import { Request, Response, NextFunction } from 'express';
import { transactionService } from '../services/transactionService.js';
import { 
  SearchRequestSchema, 
  FlowProceedSchema, 
  ManualActionSchema 
} from '../types/transaction.js';
import { logger } from '../utils/logger.js';

export class TransactionController {
  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = SearchRequestSchema.parse(req.body);
      const result = await transactionService.search(validatedData.sessionId, validatedData.flowId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async select(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = FlowProceedSchema.parse(req.body);
      const result = await transactionService.select(validatedData.transactionId, validatedData.inputs);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async init(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = FlowProceedSchema.parse(req.body);
      const result = await transactionService.init(validatedData.transactionId, validatedData.inputs);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async confirm(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = FlowProceedSchema.parse(req.body);
      const result = await transactionService.confirm(validatedData.transactionId, validatedData.inputs);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const transactionId = req.params.transactionId as string;
      const result = await transactionService.getStatus(transactionId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

export const transactionController = new TransactionController();
