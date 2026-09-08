import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Header from "../../components/Header";
import Loading from "../../components/Loading";
import EmptyState from "../../components/EmptyState";
import { useReport, useReportProductOptions } from "../../hooks/useReports";
import { reportExportService } from "../../services/ReportExportService";
import { formatCurrency } from "../../utils/format";
import { MovementSummary, ReportFilter } from "../../types/report";
import { InventoryTransaction } from "../../types/transaction";

const INITIAL_VISIBLE_TRANSACTIONS = 25;
const LOAD_MORE_COUNT = 25;

const MOVEMENT_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  RECEIPT: "arrow-down-circle",
  SALE: "arrow-up-circle",
  RETURN: "return-down-back",
  DAMAGE: "warning",
  EXPIRED: "time",
  ADJUSTMENT: "swap-horizontal",
};

const OUTBOUND_TYPES = new Set(["SALE", "DAMAGE", "EXPIRED", "ADJUSTMENT"]);

type RangeKey = "all" | "today" | "7d" | "30d" | "custom";
type PickerTarget = "from" | "to" | null;

const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: "all", label: "All time" },
  { key: "today", label: "Today" },
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "custom", label: "Custom" },
];

function startOfDay(date: Date): Date {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function endOfDay(date: Date): Date {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
}

function rangeToFilter(
  range: RangeKey,
  customFrom: Date,
  customTo: Date
): Pick<ReportFilter, "from" | "to"> {
  const now = new Date();

  if (range === "all") return {};

  if (range === "today") {
    return {
      from: startOfDay(now).toISOString(),
      to: endOfDay(now).toISOString(),
    };
  }

  if (range === "custom") {
    return {
      from: startOfDay(customFrom).toISOString(),
      to: endOfDay(customTo).toISOString(),
    };
  }

  const days = range === "7d" ? 7 : 30;
  const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return { from: from.toISOString(), to: now.toISOString() };
}

function formatDateOnly(date: Date): string {
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatTransactionDate(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function productNameFor(tx: InventoryTransaction): string {
  return tx.products?.name ?? tx.product_id;
}

function createdByFor(tx: InventoryTransaction): string {
  return tx.profiles?.name ?? tx.profiles?.email ?? "Unknown user";
}

export default function ReportsScreen() {
  const today = useMemo(() => new Date(), []);
  const initialFrom = useMemo(
    () => new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
    [today]
  );

  const [range, setRange] = useState<RangeKey>("all");
  const [productId, setProductId] = useState<string | undefined>(undefined);
  const [productOpen, setProductOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState(initialFrom);
  const [customTo, setCustomTo] = useState(today);
  const [draftFrom, setDraftFrom] = useState(initialFrom);
  const [draftTo, setDraftTo] = useState(today);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_TRANSACTIONS);
  const [exporting, setExporting] = useState<"csv" | "pdf" | null>(null);

  const dateRange = useMemo(
    () => rangeToFilter(range, customFrom, customTo),
    [range, customFrom, customTo]
  );

  const filter = useMemo<ReportFilter>(
    () => ({ ...dateRange, productId }),
    [dateRange, productId]
  );

  const { data: report, isLoading, isError, refetch, isRefetching } =
    useReport(filter);
  const { data: productOptions } = useReportProductOptions();

  const selectedProduct = productOptions?.find((p) => p.id === productId);
  const visibleTransactions = report?.recentTransactions.slice(0, visibleCount) ?? [];
  const hasMoreTransactions =
    (report?.recentTransactions.length ?? 0) > visibleTransactions.length;

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_TRANSACTIONS);
  }, [range, productId, customFrom, customTo]);

  function handleRangePress(nextRange: RangeKey) {
    if (nextRange === "custom") {
      setDraftFrom(customFrom);
      setDraftTo(customTo);
      setPickerTarget(null);
      setCustomOpen(true);
      return;
    }
    setRange(nextRange);
  }

  function handleSelectProduct(id: string | undefined) {
    setProductId(id);
    setProductOpen(false);
  }

  function applyCustomRange() {
    if (draftFrom.getTime() > draftTo.getTime()) {
      Alert.alert("Invalid date range", "The start date must be on or before the end date.");
      return;
    }

    setCustomFrom(draftFrom);
    setCustomTo(draftTo);
    setRange("custom");
    setPickerTarget(null);
    setCustomOpen(false);
  }

  function handlePickerChange(selected?: Date) {
    if (!selected || !pickerTarget) {
      setPickerTarget(null);
      return;
    }

    if (pickerTarget === "from") setDraftFrom(selected);
    else setDraftTo(selected);
    setPickerTarget(null);
  }

  async function handleExport(type: "csv" | "pdf") {
    if (!report || exporting) return;

    try {
      setExporting(type);
      const context = {
        report,
        filter,
        productName: selectedProduct?.name,
      };

      if (type === "csv") await reportExportService.exportCsv(context);
      else await reportExportService.exportPdf(context);
    } catch (error) {
      const message = error instanceof Error ? error.message : "The report could not be exported.";
      Alert.alert("Export failed", message);
    } finally {
      setExporting(null);
    }
  }

  if (isLoading) return <Loading message="Preparing report..." />;

  if (isError || !report) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text style={styles.errorTitle}>Could not load report</Text>
        <Text style={styles.errorMessage}>Check your connection and try again.</Text>
        <Pressable style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Reports" />

      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rangeRow}>
          {RANGE_OPTIONS.map((option) => {
            const active = range === option.key;
            return (
              <Pressable
                key={option.key}
                style={[styles.rangeChip, active && styles.rangeChipActive]}
                onPress={() => handleRangePress(option.key)}
              >
                <Text style={[styles.rangeChipText, active && styles.rangeChipTextActive]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {range === "custom" ? (
          <Text style={styles.customRangeLabel}>
            {formatDateOnly(customFrom)} – {formatDateOnly(customTo)}
          </Text>
        ) : null}

        <Pressable style={styles.productFilter} onPress={() => setProductOpen(true)}>
          <Ionicons name="filter-outline" size={16} color="#2563eb" />
          <Text style={styles.productFilterText} numberOfLines={1}>
            {selectedProduct ? selectedProduct.name : "All products"}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#94a3b8" />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        <View style={styles.reportHeadingRow}>
          <View style={styles.reportHeadingText}>
            <Text style={styles.reportTitle}>Stock movement report</Text>
            <Text style={styles.reportScope}>
              {selectedProduct?.name ?? "All products"} · {report.totalMovements} transactions
            </Text>
          </View>
          <View style={styles.exportRow}>
            <Pressable style={styles.exportButton} onPress={() => handleExport("csv")} disabled={!!exporting}>
              <Ionicons name="document-text-outline" size={16} color="#2563eb" />
              <Text style={styles.exportButtonText}>{exporting === "csv" ? "CSV…" : "CSV"}</Text>
            </Pressable>
            <Pressable style={styles.exportButton} onPress={() => handleExport("pdf")} disabled={!!exporting}>
              <Ionicons name="document-outline" size={16} color="#2563eb" />
              <Text style={styles.exportButtonText}>{exporting === "pdf" ? "PDF…" : "PDF"}</Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Inventory Overview</Text>
        <Text style={styles.sectionNote}>Current stock snapshot; date filters apply to movement activity below.</Text>
        <View style={styles.statGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{report.totalProducts}</Text>
            <Text style={styles.statLabel}>Products</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{report.totalUnits}</Text>
            <Text style={styles.statLabel}>Units in stock</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatCurrency(report.inventoryValue)}</Text>
            <Text style={styles.statLabel}>Inventory value</Text>
          </View>
          <View style={[styles.statCard, report.lowStockCount > 0 && styles.statCardWarn]}>
            <Text style={[styles.statValue, report.lowStockCount > 0 && styles.statValueWarn]}>
              {report.lowStockCount}
            </Text>
            <Text style={styles.statLabel}>Low stock</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Stock Activity</Text>
        <View style={styles.card}>
          <View style={styles.activityRow}>
            <Ionicons name="arrow-down-circle" size={20} color="#16a34a" />
            <Text style={styles.activityLabel}>Stocked in</Text>
            <Text style={styles.activityValue}>{report.stockInUnits} units</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.activityRow}>
            <Ionicons name="arrow-up-circle" size={20} color="#dc2626" />
            <Text style={styles.activityLabel}>Stocked out</Text>
            <Text style={styles.activityValue}>{report.stockOutUnits} units</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.activityRow}>
            <Ionicons name="swap-horizontal" size={20} color="#2563eb" />
            <Text style={styles.activityLabel}>Movements</Text>
            <Text style={styles.activityValue}>{report.totalMovements}</Text>
          </View>
        </View>

        {report.movements.some((movement) => movement.count > 0) ? (
          <>
            <Text style={styles.sectionTitle}>Movements by type</Text>
            <View style={styles.card}>
              {report.movements
                .filter((movement) => movement.count > 0)
                .map((movement: MovementSummary, index: number) => (
                  <View key={movement.type}>
                    {index > 0 ? <View style={styles.divider} /> : null}
                    <View style={styles.movementRow}>
                      <Ionicons name={MOVEMENT_ICONS[movement.type] ?? "ellipse"} size={18} color="#475569" />
                      <Text style={styles.movementLabel}>{movement.label}</Text>
                      <Text style={styles.movementCount}>{movement.count} txns</Text>
                      <Text style={styles.movementUnits}>{movement.totalUnits} units</Text>
                    </View>
                  </View>
                ))}
            </View>
          </>
        ) : null}

        <View style={styles.transactionSectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Transaction Details</Text>
            <Text style={styles.sectionNote}>Line-by-line movements for the active report filters.</Text>
          </View>
          <Text style={styles.transactionTotal}>{report.totalMovements}</Text>
        </View>

        {visibleTransactions.length > 0 ? (
          <View style={styles.transactionList}>
            {visibleTransactions.map((tx) => {
              const outbound = OUTBOUND_TYPES.has(tx.transaction_type);
              const signedQuantity = outbound ? -Math.abs(Number(tx.quantity)) : Math.abs(Number(tx.quantity));
              return (
                <View key={tx.id} style={styles.transactionRow}>
                  <View style={styles.transactionTopRow}>
                    <View style={styles.transactionMain}>
                      <Text style={styles.transactionProduct} numberOfLines={1}>{productNameFor(tx)}</Text>
                      <Text style={styles.transactionDate}>{formatTransactionDate(tx.created_at)}</Text>
                    </View>
                    <Text style={[styles.transactionQuantity, outbound ? styles.quantityOut : styles.quantityIn]}>
                      {signedQuantity > 0 ? "+" : ""}{signedQuantity}
                    </Text>
                  </View>
                  <View style={styles.transactionMetaRow}>
                    <Text style={styles.transactionType}>{tx.transaction_type}</Text>
                    <Text style={styles.transactionMeta}>By {createdByFor(tx)}</Text>
                  </View>
                  {tx.remarks ? <Text style={styles.transactionRemarks}>{tx.remarks}</Text> : null}
                </View>
              );
            })}

            {hasMoreTransactions ? (
              <Pressable style={styles.loadMoreButton} onPress={() => setVisibleCount((count) => count + LOAD_MORE_COUNT)}>
                <Text style={styles.loadMoreText}>
                  Load more ({report.recentTransactions.length - visibleTransactions.length} remaining)
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <EmptyState icon="receipt-outline" title="No transactions" message="No stock movements match the selected report filters." />
        )}

        <Text style={styles.sectionTitle}>Low Stock</Text>
        <Text style={styles.sectionNote}>Current stock snapshot.</Text>
        {report.lowStockItems.length > 0 ? (
          report.lowStockItems.map((item) => (
            <Pressable
              key={item.id}
              style={styles.lowStockRow}
              onPress={() => router.push({ pathname: "/product/[id]", params: { id: item.id } })}
            >
              <View style={styles.lowStockInfo}>
                <Text style={styles.lowStockName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.lowStockMeta}>{formatCurrency(item.price)} · {item.id.slice(0, 8)}</Text>
              </View>
              <Text style={styles.lowStockBadge}>{item.stock_quantity} left</Text>
              <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
            </Pressable>
          ))
        ) : (
          <EmptyState icon="checkmark-circle-outline" title="No low-stock items" message="All products are above the alert threshold." />
        )}
      </ScrollView>

      <Modal visible={productOpen} animationType="slide" transparent onRequestClose={() => setProductOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter by product</Text>
              <Pressable onPress={() => setProductOpen(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color="#64748b" />
              </Pressable>
            </View>

            <Pressable style={styles.productOptionRow} onPress={() => handleSelectProduct(undefined)}>
              <Text style={styles.productOptionName}>All products</Text>
              {!productId ? <Ionicons name="checkmark" size={18} color="#2563eb" /> : null}
            </Pressable>

            <FlatList
              data={productOptions ?? []}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable style={styles.productOptionRow} onPress={() => handleSelectProduct(item.id)}>
                  <Text style={styles.productOptionName} numberOfLines={1}>{item.name}</Text>
                  {productId === item.id ? <Ionicons name="checkmark" size={18} color="#2563eb" /> : null}
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>

      <Modal visible={customOpen} animationType="fade" transparent onRequestClose={() => setCustomOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.dateModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Custom date range</Text>
              <Pressable onPress={() => setCustomOpen(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color="#64748b" />
              </Pressable>
            </View>

            <Text style={styles.dateFieldLabel}>From</Text>
            <Pressable style={styles.dateField} onPress={() => setPickerTarget("from")}>
              <Ionicons name="calendar-outline" size={18} color="#2563eb" />
              <Text style={styles.dateFieldText}>{formatDateOnly(draftFrom)}</Text>
            </Pressable>

            <Text style={styles.dateFieldLabel}>To</Text>
            <Pressable style={styles.dateField} onPress={() => setPickerTarget("to")}>
              <Ionicons name="calendar-outline" size={18} color="#2563eb" />
              <Text style={styles.dateFieldText}>{formatDateOnly(draftTo)}</Text>
            </Pressable>

            {pickerTarget ? (
              <DateTimePicker
                value={pickerTarget === "from" ? draftFrom : draftTo}
                mode="date"
                maximumDate={pickerTarget === "from" ? draftTo : today}
                minimumDate={pickerTarget === "to" ? draftFrom : undefined}
                onChange={(_event, selectedDate) => handlePickerChange(selectedDate)}
              />
            ) : null}

            <View style={styles.dateActions}>
              <Pressable style={styles.secondaryButton} onPress={() => setCustomOpen(false)}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.primaryButton} onPress={applyCustomRange}>
                <Text style={styles.primaryButtonText}>Apply</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  errorTitle: { fontSize: 18, fontWeight: "700", color: "#0f172a", marginTop: 12 },
  errorMessage: { fontSize: 14, color: "#64748b", marginTop: 4, marginBottom: 16, textAlign: "center" },
  retryButton: { backgroundColor: "#2563eb", borderRadius: 10, paddingVertical: 10, paddingHorizontal: 20 },
  retryButtonText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  filterBar: { paddingHorizontal: 16, paddingBottom: 12 },
  rangeRow: { gap: 8, paddingRight: 16, paddingBottom: 8 },
  rangeChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: "#e2e8f0" },
  rangeChipActive: { backgroundColor: "#2563eb" },
  rangeChipText: { color: "#475569", fontSize: 13, fontWeight: "600" },
  rangeChipTextActive: { color: "#fff" },
  customRangeLabel: { fontSize: 12, color: "#64748b", marginBottom: 8 },
  productFilter: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#fff", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: "#e2e8f0" },
  productFilterText: { flex: 1, color: "#0f172a", fontSize: 14, fontWeight: "600" },
  reportHeadingRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 18 },
  reportHeadingText: { flex: 1 },
  reportTitle: { fontSize: 20, fontWeight: "800", color: "#0f172a" },
  reportScope: { fontSize: 12, color: "#64748b", marginTop: 3 },
  exportRow: { flexDirection: "row", gap: 8 },
  exportButton: { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderColor: "#bfdbfe", backgroundColor: "#eff6ff", borderRadius: 9, paddingHorizontal: 10, paddingVertical: 8 },
  exportButtonText: { fontSize: 12, fontWeight: "700", color: "#2563eb" },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 8, marginBottom: 6 },
  sectionNote: { fontSize: 12, color: "#94a3b8", marginBottom: 10 },
  statGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  statCard: { width: "48%", backgroundColor: "#fff", borderRadius: 14, padding: 16, marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6, elevation: 1 },
  statCardWarn: { borderWidth: 1, borderColor: "#fecaca" },
  statValue: { fontSize: 22, fontWeight: "800", color: "#0f172a", marginBottom: 4 },
  statValueWarn: { color: "#dc2626" },
  statLabel: { fontSize: 13, color: "#64748b" },
  card: { backgroundColor: "#fff", borderRadius: 14, padding: 16, marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6, elevation: 1 },
  activityRow: { flexDirection: "row", alignItems: "center" },
  activityLabel: { flex: 1, fontSize: 15, fontWeight: "600", color: "#0f172a", marginLeft: 10 },
  activityValue: { fontSize: 15, fontWeight: "700", color: "#475569" },
  divider: { height: 1, backgroundColor: "#e2e8f0", marginVertical: 12 },
  movementRow: { flexDirection: "row", alignItems: "center" },
  movementLabel: { flex: 1, fontSize: 14, fontWeight: "500", color: "#0f172a", marginLeft: 10 },
  movementCount: { fontSize: 13, color: "#64748b", marginRight: 12 },
  movementUnits: { fontSize: 13, fontWeight: "700", color: "#2563eb", minWidth: 70, textAlign: "right" },
  transactionSectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 2 },
  transactionTotal: { fontSize: 14, fontWeight: "800", color: "#2563eb", marginBottom: 10 },
  transactionList: { marginBottom: 18 },
  transactionRow: { backgroundColor: "#fff", borderRadius: 12, padding: 13, marginBottom: 9, borderWidth: 1, borderColor: "#e2e8f0" },
  transactionTopRow: { flexDirection: "row", alignItems: "flex-start" },
  transactionMain: { flex: 1, marginRight: 12 },
  transactionProduct: { fontSize: 14, fontWeight: "700", color: "#0f172a" },
  transactionDate: { fontSize: 11, color: "#64748b", marginTop: 3 },
  transactionQuantity: { fontSize: 16, fontWeight: "800" },
  quantityIn: { color: "#16a34a" },
  quantityOut: { color: "#dc2626" },
  transactionMetaRow: { flexDirection: "row", alignItems: "center", marginTop: 9, gap: 8 },
  transactionType: { backgroundColor: "#f1f5f9", color: "#475569", borderRadius: 999, overflow: "hidden", paddingHorizontal: 8, paddingVertical: 3, fontSize: 10, fontWeight: "700" },
  transactionMeta: { flex: 1, fontSize: 11, color: "#64748b" },
  transactionRemarks: { fontSize: 12, color: "#475569", marginTop: 8 },
  loadMoreButton: { alignItems: "center", paddingVertical: 12, borderRadius: 10, backgroundColor: "#eff6ff" },
  loadMoreText: { color: "#2563eb", fontWeight: "700", fontSize: 13 },
  lowStockRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 12, padding: 14, marginBottom: 10, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6, elevation: 1 },
  lowStockInfo: { flex: 1, marginRight: 8 },
  lowStockName: { fontSize: 15, fontWeight: "700", color: "#0f172a" },
  lowStockMeta: { fontSize: 12, color: "#64748b", marginTop: 2 },
  lowStockBadge: { backgroundColor: "#fee2e2", color: "#dc2626", fontSize: 12, fontWeight: "700", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, overflow: "hidden", marginRight: 6 },
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(15,23,42,0.45)" },
  modalSheet: { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "70%", padding: 16 },
  dateModalCard: { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 18 },
  modalHeader: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  modalTitle: { flex: 1, fontSize: 18, fontWeight: "800", color: "#0f172a" },
  productOptionRow: { flexDirection: "row", alignItems: "center", paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  productOptionName: { flex: 1, fontSize: 14, color: "#0f172a" },
  dateFieldLabel: { fontSize: 12, fontWeight: "700", color: "#64748b", marginTop: 8, marginBottom: 5 },
  dateField: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, padding: 12 },
  dateFieldText: { fontSize: 14, fontWeight: "600", color: "#0f172a" },
  dateActions: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 18 },
  secondaryButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 9, borderWidth: 1, borderColor: "#cbd5e1" },
  secondaryButtonText: { color: "#475569", fontWeight: "700" },
  primaryButton: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 9, backgroundColor: "#2563eb" },
  primaryButtonText: { color: "#fff", fontWeight: "700" },
});
