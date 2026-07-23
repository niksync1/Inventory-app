import { transactionRepository } from "../repositories/TransactionRepository";
import { InventoryTransaction } from "../types/transaction";

export class TransactionService {
  async getRecentTransactions(limit = 50): Promise<InventoryTransaction[]> {
    return transactionRepository.findMany(limit);
  }

  async getTransactionsByProduct(
    productId: string
  ): Promise<InventoryTransaction[]> {
    if (!productId) {
      return [];
    }

    return transactionRepository.findByProduct(productId);
  }
}

export const transactionService = new TransactionService();