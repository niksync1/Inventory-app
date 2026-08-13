import { useQuery } from "@tanstack/react-query";
import { transactionService } from "../services/TransactionService";
import { TransactionFilter } from "../repositories/TransactionRepository";
import { STALE_TIMES } from "../utils/constants";

export function useRecentTransactions(limit = 50, filter: TransactionFilter = {}) {
  return useQuery({
    queryKey: ["transactions", "recent", limit, filter],
    queryFn: () => transactionService.getRecentTransactions(limit, filter),
    staleTime: STALE_TIMES.TRANSACTIONS,
  });
}

export function useProductTransactions(productId: string | undefined) {
  return useQuery({
    queryKey: ["transactions", "product", productId],
    queryFn: () => transactionService.getTransactionsByProduct(productId!),
    enabled: !!productId,
    staleTime: STALE_TIMES.TRANSACTIONS,
  });
}