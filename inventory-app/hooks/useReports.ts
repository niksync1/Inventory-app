import { useQuery } from "@tanstack/react-query";
import { reportService } from "../services/ReportService";
import { STALE_TIMES } from "../utils/constants";
import { ReportFilter } from "../types/report";

export function useReport(filter: ReportFilter = {}, transactionLimit = 200) {
  return useQuery({
    queryKey: ["report", "inventory", transactionLimit, filter],
    queryFn: () => reportService.getReport(filter, transactionLimit),
    staleTime: STALE_TIMES.INVENTORY,
  });
}

export function useReportProductOptions() {
  return useQuery({
    queryKey: ["report", "product-options"],
    queryFn: () => reportService.getProductOptions(),
    staleTime: STALE_TIMES.PRODUCT,
  });
}
