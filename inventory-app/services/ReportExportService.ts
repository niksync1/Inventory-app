import { File, Paths } from "expo-file-system";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { InventoryReport, ReportFilter } from "../types/report";
import { InventoryTransaction } from "../types/transaction";

export interface ReportExportContext {
  report: InventoryReport;
  filter: ReportFilter;
  productName?: string;
}

function csvCell(value: unknown): string {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function htmlEscape(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString();
}

function periodLabel(filter: ReportFilter): string {
  if (!filter.from && !filter.to) return "All time";
  const from = filter.from ? new Date(filter.from).toLocaleDateString() : "Start";
  const to = filter.to ? new Date(filter.to).toLocaleDateString() : "Present";
  return `${from} – ${to}`;
}

function createdByLabel(tx: InventoryTransaction): string {
  return tx.profiles?.name || tx.profiles?.email || tx.created_by || "—";
}

function transactionProductLabel(tx: InventoryTransaction): string {
  return tx.products?.name || tx.product_id;
}

function makeFileName(extension: "csv" | "pdf"): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `inventory-report-${stamp}.${extension}`;
}

async function shareFile(uri: string, mimeType: string, dialogTitle: string) {
  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error("File sharing is not available on this device.");
  }

  await Sharing.shareAsync(uri, {
    mimeType,
    dialogTitle,
  });
}

export class ReportExportService {
  async exportCsv(context: ReportExportContext): Promise<void> {
    const headers = [
      "Date/Time",
      "Product",
      "Transaction Type",
      "Quantity",
      "Remarks",
      "Created By",
      "Operation ID",
    ];

    const rows = context.report.recentTransactions.map((tx) => [
      formatDateTime(tx.created_at),
      transactionProductLabel(tx),
      tx.transaction_type,
      tx.quantity,
      tx.remarks ?? "",
      createdByLabel(tx),
      tx.operation_id ?? "",
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map(csvCell).join(","))
      .join("\n");

    const file = new File(Paths.cache, makeFileName("csv"));
    file.create({ overwrite: true });
    file.write(csv);

    await shareFile(file.uri, "text/csv", "Export inventory report as CSV");
  }

  async exportPdf(context: ReportExportContext): Promise<void> {
    const { report, filter, productName } = context;
    const transactionRows = report.recentTransactions
      .map(
        (tx) => `
          <tr>
            <td>${htmlEscape(formatDateTime(tx.created_at))}</td>
            <td>${htmlEscape(transactionProductLabel(tx))}</td>
            <td>${htmlEscape(tx.transaction_type)}</td>
            <td class="num">${htmlEscape(tx.quantity)}</td>
            <td>${htmlEscape(tx.remarks ?? "")}</td>
            <td>${htmlEscape(createdByLabel(tx))}</td>
          </tr>`
      )
      .join("");

    const html = `<!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            @page { margin: 24px; }
            body { font-family: Arial, sans-serif; color: #0f172a; font-size: 11px; }
            h1 { margin: 0 0 4px; font-size: 22px; }
            .meta { color: #475569; margin-bottom: 18px; }
            .summary { display: flex; gap: 12px; margin-bottom: 18px; }
            .summary-box { border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px; min-width: 110px; }
            .label { color: #64748b; font-size: 9px; text-transform: uppercase; }
            .value { font-size: 16px; font-weight: 700; margin-top: 3px; }
            table { width: 100%; border-collapse: collapse; }
            th { text-align: left; background: #f1f5f9; padding: 7px; border-bottom: 1px solid #cbd5e1; }
            td { padding: 7px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
            .num { text-align: right; white-space: nowrap; }
          </style>
        </head>
        <body>
          <h1>Inventory Movement Report</h1>
          <div class="meta">
            Period: ${htmlEscape(periodLabel(filter))}<br />
            Product: ${htmlEscape(productName ?? "All products")}
          </div>

          <div class="summary">
            <div class="summary-box">
              <div class="label">Transactions</div>
              <div class="value">${report.totalMovements}</div>
            </div>
            <div class="summary-box">
              <div class="label">Stocked in</div>
              <div class="value">${report.stockInUnits}</div>
            </div>
            <div class="summary-box">
              <div class="label">Stocked out</div>
              <div class="value">${report.stockOutUnits}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Date / Time</th>
                <th>Product</th>
                <th>Type</th>
                <th class="num">Qty</th>
                <th>Remarks</th>
                <th>Created By</th>
              </tr>
            </thead>
            <tbody>${transactionRows}</tbody>
          </table>
        </body>
      </html>`;

    const { uri } = await Print.printToFileAsync({ html });
    await shareFile(uri, "application/pdf", "Export inventory report as PDF");
  }
}

export const reportExportService = new ReportExportService();
