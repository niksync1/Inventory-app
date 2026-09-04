import { useLocalSearchParams, useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useProduct } from "../../hooks/useProduct";
import { useOfflineStore } from "../../store/offlineStore";
import ProductImage from "../../components/ProductImage";

export default function ProductDetailScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { data: product, isLoading, isError } = useProduct(id ?? "");
  const isOnline = useOfflineStore((state) => state.isOnline);

  function handleBack() {
    queryClient.removeQueries({ queryKey: ["product", id] });
    queryClient.cancelQueries({ queryKey: ["product", id] });
    queryClient.removeQueries({ queryKey: ["lookup-product"] });

    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/(tabs)/scan");
  }

  if (!id) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>No product selected.</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.subtitle}>Loading product details...</Text>
      </View>
    );
  }

  if (isError || !product) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Product could not be loaded.</Text>
        <Pressable style={styles.button} onPress={handleBack}>
          <Text style={styles.buttonText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Pressable style={styles.backButton} onPress={handleBack}>
        <Text style={styles.backButtonText}>← Back</Text>
      </Pressable>

      <ProductImage
        images={product.images}
        size="lg"
        resizeMode="cover"
      />

      <Text style={styles.title}>{product.name}</Text>
      <Text style={styles.subtitle}>{product.description ?? "No description available."}</Text>

      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>Barcode</Text>
        <Text style={styles.infoValue}>{product.barcode}</Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>Category</Text>
        <Text style={styles.infoValue}>{product.category ?? "Uncategorized"}</Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>Price</Text>
        <Text style={styles.infoValue}>GHS {product.price.toFixed(2)}</Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>
          {isOnline ? "Stock" : "Stock (last synced)"}
        </Text>
        <Text style={[styles.infoValue, product.stock_quantity <= 5 && styles.stockLow]}>
          {product.stock_quantity}
        </Text>
        {!isOnline ? (
          <Text style={styles.cacheNote}>
            Offline snapshot. Queued stock changes are not included in this figure.
          </Text>
        ) : null}
      </View>

      <View style={styles.actionsRow}>
        <Pressable
          style={[styles.actionButton, styles.stockInButton]}
          onPress={() =>
            router.push({
              pathname: "/product/stock-in",
              params: { id: product.id },
            })
          }
        >
          <Text style={styles.actionButtonText}>Stock In</Text>
        </Pressable>

        <Pressable
          style={[styles.actionButton, styles.stockOutButton]}
          onPress={() =>
            router.push({
              pathname: "/product/stock-out",
              params: { id: product.id },
            })
          }
        >
          <Text style={styles.actionButtonText}>Stock Out</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  contentContainer: {
    padding: 24,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#f8fafc",
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    color: "#2563eb",
    fontSize: 16,
    fontWeight: "600",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#475569",
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  infoLabel: {
    fontSize: 12,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    color: "#0f172a",
    marginTop: 4,
    fontWeight: "600",
  },
  cacheNote: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 17,
    color: "#92400e",
  },
  stockLow: {
    color: "#dc2626",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  stockInButton: {
    backgroundColor: "#16a34a",
  },
  stockOutButton: {
    backgroundColor: "#dc2626",
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  button: {
    backgroundColor: "#2563eb",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginTop: 12,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
