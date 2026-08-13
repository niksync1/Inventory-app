import { transactionRepository, TransactionFilter } from "../repositories/TransactionRepository";
import { InventoryTransaction } from "../types/transaction";

export class TransactionService {
  async getRecentTransactions(
    limit = 50,
    filter: TransactionFilter = {}
  ): Promise<InventoryTransaction[]> {
    return transactionRepository.findMany(limit, 0, filter);
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
