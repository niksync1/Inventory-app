import { useLocalSearchParams, useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useProduct } from "../../hooks/useProduct";

export default function ProductDetailScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { data: product, isLoading, isError } = useProduct(id ?? "");

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
    <View style={styles.container}>
      <Pressable style={styles.backButton} onPress={handleBack}>
        <Text style={styles.backButtonText}>← Back</Text>
      </Pressable>

      {product.images?.[0] ? (
        <Image source={{ uri: product.images[0] }} style={styles.image} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.imagePlaceholderText}>No image available</Text>
        </View>
      )}

      <Text style={styles.title}>{product.name}</Text>
      <Text style={styles.subtitle}>{product.description ?? "No description available."}</Text>

      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>Barcode</Text>
        <Text style={styles.infoValue}>{product.barcode}</Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>Price</Text>
        <Text style={styles.infoValue}>${product.price.toFixed(2)}</Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>Stock</Text>
        <Text style={styles.infoValue}>{product.stock_quantity}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#f8fafc",
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
  image: {
    width: "100%",
    height: 220,
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: "#e2e8f0",
  },
  imagePlaceholder: {
    width: "100%",
    height: 220,
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: "#e2e8f0",
    justifyContent: "center",
    alignItems: "center",
  },
  imagePlaceholderText: {
    color: "#64748b",
    fontSize: 14,
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