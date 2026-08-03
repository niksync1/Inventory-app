import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Header from "../../components/Header";
import Loading from "../../components/Loading";
import EmptyState from "../../components/EmptyState";
import { useRecentTransactions } from "../../hooks/useTransactions";
import { InventoryTransaction } from "../../types/transaction";
import { TRANSACTION_TYPE_LABELS } from "../../utils/constants";

export default function HistoryScreen() {
  const { data: transactions, isLoading, isError, error, refetch, isRefetching } =
    useRecentTransactions(50);

  if (isLoading) {
    return <Loading message="Loading transaction history..." />;
  }

  return (
    <View style={styles.container}>
      <Header title="History" />

      {isError ? (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
          <Text style={styles.errorTitle}>Could not load history</Text>
          <Text style={styles.errorText}>
            {error instanceof Error ? error.message : "Please try again."}
          </Text>
          <Pressable style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={transactions ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={
            transactions && transactions.length > 0
              ? styles.listContent
              : styles.emptyContent
          }
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="time-outline"
              title="No transactions yet"
              message="Stock movements will appear here once inventory is updated."
            />
          }
          renderItem={({ item }) => <TransactionCard transaction={item} />}
        />
      )}
    </View>
  );
}

function TransactionCard({ transaction }: { transaction: InventoryTransaction }) {
  const isPositive = transaction.quantity > 0;
  const quantityPrefix = isPositive ? "+" : "";
  const productName = transaction.products?.name ?? "Unknown product";
  const barcode = transaction.products?.barcode;
  const creator = getCreatorLabel(transaction);
  const typeLabel =
    TRANSACTION_TYPE_LABELS[transaction.transaction_type] ?? transaction.transaction_type;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconWrap}>
          <Ionicons
            name={isPositive ? "arrow-down-circle" : "arrow-up-circle"}
            size={22}
            color={isPositive ? "#16a34a" : "#dc2626"}
          />
        </View>
        <View style={styles.cardTitleWrap}>
          <Text style={styles.productName} numberOfLines={1}>
            {productName}
          </Text>
          <Text style={styles.metaText}>{formatDate(transaction.created_at)} • By {creator}</Text>
        </View>
        <Text style={[styles.quantity, isPositive ? styles.positive : styles.negative]}>
          {quantityPrefix}{transaction.quantity}
        </Text>
      </View>

      <View style={styles.detailsRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{typeLabel}</Text>
        </View>
        {barcode ? <Text style={styles.barcode}>Barcode: {barcode}</Text> : null}
      </View>

      {transaction.remarks ? (
        <Text style={styles.remarks} numberOfLines={2}>{transaction.remarks}</Text>
      ) : null}
    </View>
  );
}

function getCreatorLabel(transaction: InventoryTransaction) {
  if (transaction.profiles?.name) {
    return transaction.profiles.name;
  }

  if (transaction.profiles?.email) {
    return transaction.profiles.email;
  }

  return shortenId(transaction.created_by);
}

function shortenId(value: string) {
  if (!value) return "Unknown user";
  return `${value.slice(0, 8)}...`;
}

function formatDate(value: string) {
  const date = new Date(value);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyContent: {
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  errorTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    textAlign: "center",
  },
  errorText: {
    marginTop: 6,
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 16,
    borderRadius: 10,
    backgroundColor: "#2563eb",
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  card: {
    marginBottom: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconWrap: {
    marginRight: 10,
  },
  cardTitleWrap: {
    flex: 1,
  },
  productName: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "700",
  },
  metaText: {
    marginTop: 2,
    color: "#64748b",
    fontSize: 12,
  },
  quantity: {
    marginLeft: 10,
    fontSize: 18,
    fontWeight: "800",
  },
  positive: {
    color: "#16a34a",
  },
  negative: {
    color: "#dc2626",
  },
  detailsRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  badge: {
    borderRadius: 999,
    backgroundColor: "#dbeafe",
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    color: "#1d4ed8",
    fontSize: 12,
    fontWeight: "700",
  },
  barcode: {
    flex: 1,
    color: "#64748b",
    fontSize: 12,
    textAlign: "right",
  },
  remarks: {
    marginTop: 10,
    color: "#475569",
    fontSize: 13,
    lineHeight: 18,
  },
});
