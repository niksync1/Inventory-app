import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import ProductImage from "./ProductImage";
import { Product } from "../types";

interface Props {
  product: Product;
  onPress?: () => void;
  showBarcode?: boolean;
  showCategory?: boolean;
}

export default function ProductCard({
  product,
  onPress,
  showBarcode = false,
  showCategory = false,
}: Props) {
  function handlePress() {
    if (onPress) {
      onPress();
      return;
    }

    router.push({
      pathname: "/product/[id]",
      params: { id: product.id },
    });
  }

  const isLowStock = product.stock_quantity <= 5;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
      onPress={handlePress}
    >
      <ProductImage
        images={product.images}
        size="sm"
        style={styles.image}
      />

      <View style={styles.body}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>
            {product.name}
          </Text>
          {showCategory && product.category ? (
            <Text style={styles.category}>{product.category}</Text>
          ) : null}
        </View>

        <Text style={styles.price}>
          GHS {Number(product.price).toFixed(2)}
        </Text>

        <View style={styles.footer}>
          <Text style={[styles.stock, isLowStock && styles.stockLow]}>
            {isLowStock ? `${product.stock_quantity} left` : `Stock: ${product.stock_quantity}`}
          </Text>
          {showBarcode && product.barcode ? (
            <Text style={styles.barcode} numberOfLines={1}>
              {product.barcode}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  cardPressed: {
    opacity: 0.8,
  },
  image: {
    marginRight: 12,
  },
  body: {
    flex: 1,
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    flex: 1,
  },
  category: {
    fontSize: 11,
    fontWeight: "600",
    color: "#2563eb",
    backgroundColor: "#eff6ff",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
    overflow: "hidden",
  },
  price: {
    fontSize: 15,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 4,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
  },
  stock: {
    fontSize: 13,
    color: "#64748b",
  },
  stockLow: {
    color: "#dc2626",
    fontWeight: "600",
  },
  barcode: {
    fontSize: 12,
    color: "#94a3b8",
    marginLeft: 12,
    flex: 1,
  },
});