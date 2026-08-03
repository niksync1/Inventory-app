import { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import BarcodeScanner from '../../components/BarcodeScanner';
import Header from '../../components/Header';
import Screen from '../../components/Screen';
import { inventoryService } from '../../services/InventoryService';
import { productService } from '../../services/ProductService';
import type { Product } from '../../types/product';

export default function ReceiveScreen() {
  const [barcode, setBarcode] = useState('');
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState('');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scanKey, setScanKey] = useState(0);

  async function lookupProduct(barcodeValue: string) {
    if (!barcodeValue) {
      setProduct(null);
      return;
    }
    try {
      const found = await productService.lookupByBarcode(barcodeValue);
      setProduct(found);
    } catch {
      setProduct(null);
    }
  }

  async function handleReceive() {
    if (!barcode || !quantity) {
      Alert.alert('Validation', 'Please enter a barcode and quantity.');
      return;
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Validation', 'Quantity must be a positive number.');
      return;
    }

    // Look up product if we don't have one yet
    let targetProduct = product;
    if (!targetProduct) {
      try {
        targetProduct = await productService.lookupByBarcode(barcode);
      } catch {
        // ignored, handled below
      }
      if (!targetProduct) {
        Alert.alert('Product Not Found', `No product found with barcode: "${barcode}"`);
        return;
      }
      setProduct(targetProduct);
    }

    setLoading(true);

    try {
      await inventoryService.stockIn(targetProduct.id, qty, remarks || undefined);
      Alert.alert(
        'Success',
        `Received ${qty} unit(s) of "${targetProduct.name}"`,
      );
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Header title="Stock In" showBack />
      <View style={styles.form}>
        <Text style={styles.label}>Barcode</Text>
        <View style={styles.barcodeRow}>
          <TextInput
            style={styles.barcodeInput}
            placeholder="Scan or enter barcode"
            value={barcode}
            onChangeText={(val) => {
              setBarcode(val);
              lookupProduct(val);
            }}
          />
          <Pressable
            style={styles.scanButton}
            onPress={() => {
              setScanKey((k) => k + 1);
              setScannerVisible(true);
            }}
          >
            <Text style={styles.scanButtonText}>Scan</Text>
          </Pressable>
        </View>

        <Text style={styles.label}>Quantity</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter quantity"
          keyboardType="number-pad"
          value={quantity}
          onChangeText={setQuantity}
        />

        <Text style={styles.label}>Remarks (optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Any notes..."
          value={remarks}
          onChangeText={setRemarks}
          multiline
        />

        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleReceive}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Processing...' : 'Receive Stock'}
          </Text>
        </Pressable>
      </View>

      <Modal
        visible={scannerVisible}
        animationType="slide"
        onRequestClose={() => setScannerVisible(false)}
      >
        <View style={styles.scannerContainer}>
          <BarcodeScanner
            key={scanKey}
            onBarcodeScanned={async (data) => {
              try {
                const found = await productService.lookupByBarcode(data);
                if (found) {
                  setBarcode(data);
                  setProduct(found);
                  setScannerVisible(false);
                } else {
                  Alert.alert(
                    'Product Not Found',
                    `No product matching barcode "${data}" was found. Please scan again.`
                  );
                }
              } catch {
                Alert.alert('Error', 'Failed to look up product. Please try again.');
              }
            }}
            isEnabled={scannerVisible}
          />
          <Pressable
            style={styles.closeScannerButton}
            onPress={() => setScannerVisible(false)}
          >
            <Text style={styles.closeScannerText}>Cancel</Text>
          </Pressable>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: {
    padding: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
    color: '#0f172a',
  },
  barcodeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  barcodeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#0f172a',
  },
  scanButton: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  closeScannerButton: {
    position: 'absolute',
    bottom: 60,
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  closeScannerText: {
    color: '#2563eb',
    fontWeight: '600',
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});