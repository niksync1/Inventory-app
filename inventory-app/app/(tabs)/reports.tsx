import { useState } from "react";
import {
  ScrollView,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  Modal,
  FlatList,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Header from "../../components/Header";
import Loading from "../../components/Loading";
import EmptyState from "../../components/EmptyState";
import { useReport, useReportProductOptions } from "../../hooks/useReports";
import { formatCurrency } from "../../utils/format";
import { MovementSummary, ReportFilter } from "../../types/report";

const MOVEMENT_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  RECEIPT: "arrow-down-circle",
  SALE: "arrow-up-circle",
  RETURN: "return-down-back",
  DAMAGE: "warning",
  EXPIRED: "time",
  ADJUSTMENT: "swap-horizontal",
};

type RangeKey = "all" | "today" | "7d" | "30d";
const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: "all", label: "All time" },
  { key: "today", label: "Today" },
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
];

/** Translate a range preset into inclusive from/to ISO timestamps. */
function rangeToFilter(range: RangeKey): Pick<ReportFilter, "from" | "to"> {
  const now = new Date();
  if (range === "all") {
    return {};
  }
  if (range === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return { from: start.toISOString(), to: end.toISOString() };
  }
  const from = new Date(now.getTime() - (range === "7d" ? 7 : 30) * 24 * 60 * 60 * 1000);
  return { from: from.toISOString() };
}

export default function ReportsScreen() {
  const [range, setRange] = useState<RangeKey>("all");
  const [productId, setProductId] = useState<string | undefined>(undefined);
  const [productOpen, setProductOpen] = useState(false);

  const dateRange = rangeToFilter(range);
  const filter: ReportFilter = { ...dateRange, productId };

  const { data: report, isLoading, isError, refetch, isRefetching } =
    useReport(filter);
  const { data: productOptions } = useReportProductOptions();

  const selectedProduct = productOptions?.find((p) => p.id === productId);

  function handleSelectProduct(id: string | undefined) {
    setProductId(id);
    setProductOpen(false);
  }

  if (isLoading) {
    return <Loading message="Preparing report..." />;
  }

  if (isError || !report) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text style={styles.errorTitle}>Could not load report</Text>
        <Text style={styles.errorMessage}>
          Check your connection and try again.
        </Text>
        <Pressable style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Reports" />

      {/* Filters */}
      <View style={styles.filterBar}>
        <View style={styles.rangeRow}>
          {RANGE_OPTIONS.map((opt) => {
            const active = range === opt.key;
            return (
              <Pressable
                key={opt.key}
                style={[styles.rangeChip, active && styles.rangeChipActive]}
                onPress={() => setRange(opt.key)}
              >
                <Text style={[styles.rangeChipText, active && styles.rangeChipTextActive]}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

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
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        <Text style={styles.sectionTitle}>Inventory Overview</Text>
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

        {report.movements.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Movements by type</Text>
            <View style={styles.card}>
              {report.movements.map((m: MovementSummary, index: number) => (
                <View key={m.type}>
                  {index > 0 ? <View style={styles.divider} /> : null}
                  <View style={styles.movementRow}>
                    <Ionicons name={MOVEMENT_ICONS[m.type] ?? "ellipse"} size={18} color="#475569" />
                    <Text style={styles.movementLabel}>{m.label}</Text>
                    <Text style={styles.movementCount}>{m.count} txns</Text>
                    <Text style={styles.movementUnits}>{m.totalUnits} units</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        ) : null}
<Text style={styles.sectionTitle}>Low Stock</Text>
        {report.lowStockItems.length > 0 ? (
          report.lowStockItems.map((item) => (
            <Pressable
              key={item.id}
              style={styles.lowStockRow}
              onPress={() =>
                router.push({
                  pathname: "/product/[id]",
                  params: { id: item.id },
                })
              }
            >
              <View style={styles.lowStockInfo}>
                <Text style={styles.lowStockName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.lowStockMeta}>
                  {formatCurrency(item.price)} · {item.id.slice(0, 8)}
                </Text>
              </View>
              <Text style={styles.lowStockBadge}>
                {item.stock_quantity} left
              </Text>
              <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
            </Pressable>
          ))
        ) : (
          <EmptyState
            icon="checkmark-circle-outline"
            title="No low-stock items"
            message="All products are above the alert threshold."
          />
        )}
      </ScrollView>

      {/* Product filter modal */}
      <Modal
        visible={productOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setProductOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter by product</Text>
              <Pressable onPress={() => handleSelectProduct(undefined)} hitSlop={8}>
                <Ionicons name="close" size={22} color="#64748b" />
              </Pressable>
            </View>

            <Pressable
              style={styles.productOptionRow}
              onPress={() => handleSelectProduct(undefined)}
            >
              <Text style={styles.productOptionName}>All products</Text>
              {!productId ? (
                <Ionicons name="checkmark" size={18} color="#2563eb" />
              ) : null}
            </Pressable>

            <FlatList
              data={productOptions ?? []}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.productOptionRow}
                  onPress={() => handleSelectProduct(item.id)}
                >
                  <Text style={styles.productOptionName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  {productId === item.id ? (
                    <Ionicons name="checkmark" size={18} color="#2563eb" />
                  ) : null}
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    marginTop: 12,
  },
  errorMessage: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 4,
    marginBottom: 16,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#2563eb",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 10,
  },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  statCardWarn: {
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  statValue: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 4,
  },
  statValueWarn: {
    color: "#dc2626",
  },
  statLabel: {
    fontSize: 13,
    color: "#64748b",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  activityLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#0f172a",
    marginLeft: 10,
  },
  activityValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#475569",
  },
  divider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 12,
  },
  movementRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  movementLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#0f172a",
    marginLeft: 10,
  },
  movementCount: {
    fontSize: 13,
    color: "#64748b",
    marginRight: 12,
  },
  movementUnits: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2563eb",
    minWidth: 70,
    textAlign: "right",
  },
  lowStockRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  lowStockInfo: {
    flex: 1,
    marginRight: 8,
  },
  lowStockName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
  },
  lowStockMeta: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  lowStockBadge: {
    backgroundColor: "#fee2e2",
    color: "#dc2626",
    fontSize: 12,
    fontWeight: "700",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    overflow: "hidden",
    marginRight: 6,
  },
  filterBar: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  rangeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  rangeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#e2e8f0",
  },
  rangeChipActive: {
    backgroundColor: "#2563eb",
  },
  rangeChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
  },
  rangeChipTextActive: {
    color: "#fff",
  },
  productFilter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  productFilterText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.4)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0f172a",
  },
  productOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  productOptionName: {
    fontSize: 15,
    color: "#0f172a",
    flex: 1,
    marginRight: 8,
  },
});
