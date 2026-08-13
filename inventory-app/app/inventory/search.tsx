import { useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import Header from "../../components/Header";
import Screen from "../../components/Screen";
import Loading from "../../components/Loading";
import EmptyState from "../../components/EmptyState";
import ProductCard from "../../components/ProductCard";
import { useSearchProducts } from "../../hooks/useSearchProducts";

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const { data: results, isLoading, isError, refetch } = useSearchProducts(query);

  return (
    <Screen padded={false}>
      <Header title="Search Products" showBack />

      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#64748b" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by barcode, name, or category..."
          placeholderTextColor="#94a3b8"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {query.length > 0 ? (
          <Pressable onPress={() => setQuery("")} hitSlop={8}>
            <Ionicons name="close-circle" size={20} color="#94a3b8" />
          </Pressable>
        ) : null}
      </View>

      {query.trim().length < 2 ? (
        <EmptyState
          icon="search-outline"
          title="Search products"
          message="Enter at least 2 characters to search by barcode, product name, or category."
        />
      ) : isLoading ? (
        <Loading message="Searching products..." />
      ) : isError ? (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
          <Text style={styles.errorTitle}>Search failed</Text>
          <Text style={styles.errorText}>Please try again.</Text>
          <Pressable style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={results ?? []}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={
            results && results.length > 0 ? styles.listContent : styles.emptyContent
          }
          ListEmptyComponent={
            <EmptyState
              icon="cube-outline"
              title="No products found"
              message={`No products match "${query}". Try a different search term.`}
            />
          }
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              showBarcode
              showCategory
              onPress={() =>
                router.push({
                  pathname: "/product/[id]",
                  params: { id: item.id },
                })
              }
            />
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#0f172a",
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
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
  },
  errorText: {
    marginTop: 6,
    fontSize: 14,
    color: "#64748b",
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
});