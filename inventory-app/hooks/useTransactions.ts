import { useQuery } from "@tanstack/react-query";
import { transactionService } from "../services/TransactionService";
import { STALE_TIMES } from "../utils/constants";

export function useRecentTransactions(limit = 50) {
  return useQuery({
    queryKey: ["transactions", "recent", limit],
    queryFn: () => transactionService.getRecentTransactions(limit),
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