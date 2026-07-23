import { useQuery } from "@tanstack/react-query";
import { productService } from "../services/ProductService";
import { STALE_TIMES } from "../utils/constants";

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: () => productService.getProductById(id!),
    enabled: !!id,
    staleTime: STALE_TIMES.PRODUCT,
  });
}