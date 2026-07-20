import { useQuery } from "@tanstack/react-query";
import { productService } from "../services/productService";

export function useProduct(id: string) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: () => productService.getById(id),
    enabled: !!id,
  });
}