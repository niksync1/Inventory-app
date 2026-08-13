import { useQuery } from "@tanstack/react-query";
import { productService } from "../services/ProductService";
import { STALE_TIMES } from "../utils/constants";

export function useSearchProducts(query: string) {
  return useQuery({
    queryKey: ["search-products", query],
    queryFn: () => productService.searchProducts(query),
    enabled: query.trim().length >= 2,
    staleTime: STALE_TIMES.PRODUCT,
  });
}