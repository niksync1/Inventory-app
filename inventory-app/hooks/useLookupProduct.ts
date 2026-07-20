import { useMutation } from "@tanstack/react-query";
import { productService } from "../services/productService";

export function useLookupProduct() {
  return useMutation({
    mutationKey: ["lookup-product"],
    mutationFn: async (barcode: string) => {
      return productService.getByBarcode(barcode);
    },
  });
}