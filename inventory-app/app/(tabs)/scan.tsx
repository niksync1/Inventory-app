import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import BarcodeScanner from "../../components/BarcodeScanner";
import { router } from "expo-router";
import { useLookupProduct } from "../../hooks/useLookupProduct";

export default function ScanScreen() {
  const [isScanning, setIsScanning] = useState(true);
  const [status, setStatus] = useState<"idle" | "not-found" | "error">("idle");
  const [lastBarcode, setLastBarcode] = useState<string | null>(null);
  const lookup = useLookupProduct();

  async function handleBarcode(barcode: string) {
    if (!barcode) {
      return;
    }

    setIsScanning(false);
    setStatus("idle");
    setLastBarcode(barcode);

    try {
      const product = await lookup.mutateAsync(barcode);

      if (!product) {
        setStatus("not-found");
        return;
      }

      router.push({
        pathname: "/product/[id]",
        params: {
          id: product.id,
        },
      });
    } catch (error) {
      console.error(error);
      setStatus("error");
    }
  }

  function handleRetry() {
    setStatus("idle");
    setIsScanning(true);
  }

  return (
    <View style={{ flex: 1 }}>
      <BarcodeScanner
        isEnabled={isScanning}
        onBarcodeScanned={handleBarcode}
      />

      {status !== "idle" ? (
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Text style={styles.title}>
              {status === "not-found"
                ? "Product not found"
                : "We couldn’t reach the product service"}
            </Text>
            <Text style={styles.message}>
              {status === "not-found"
                ? `No product matching ${lastBarcode ?? "that barcode"} was found. You can try scanning again.`
                : "The lookup failed due to a network issue. Please try again."}
            </Text>

            <Pressable style={styles.button} onPress={handleRetry}>
              <Text style={styles.buttonText}>
                {status === "not-found" ? "Scan Again" : "Retry"}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontSize: 15,
    color: "#475569",
    textAlign: "center",
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#2563eb",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
});