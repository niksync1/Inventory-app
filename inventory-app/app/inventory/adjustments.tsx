import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import Header from '../../components/Header';
import Screen from '../../components/Screen';

const REASONS = ['DAMAGE', 'EXPIRED', 'ADJUSTMENT', 'SALE'] as const;

export default function AdjustmentsScreen() {
  const [barcode, setBarcode] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState<string>('');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleStockOut() {
    if (!barcode || !quantity || !reason) {
      Alert.alert('Validation', 'Please fill in all required fields.');
      return;
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Validation', 'Quantity must be a positive number.');
      return;
    }

    setLoading(true);

    try {
      Alert.alert('Success', `Stock out: ${qty} units (${reason}).`);
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Header title="Stock Out" showBack />
      <View style={styles.form}>
        <Text style={styles.label}>Barcode</Text>
        <TextInput
          style={styles.input}
          placeholder="Scan or enter barcode"
          value={barcode}
          onChangeText={setBarcode}
        />

        <Text style={styles.label}>Quantity</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter quantity"
          keyboardType="number-pad"
          value={quantity}
          onChangeText={setQuantity}
        />

        <Text style={styles.label}>Reason</Text>
        <View style={styles.reasonRow}>
          {REASONS.map((r) => (
            <Pressable
              key={r}
              style={[styles.reasonChip, reason === r && styles.reasonChipActive]}
              onPress={() => setReason(r)}
            >
              <Text style={[styles.reasonText, reason === r && styles.reasonTextActive]}>
                {r}
              </Text>
            </Pressable>
          ))}
        </View>

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
          onPress={handleStockOut}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Processing...' : 'Remove Stock'}
          </Text>
        </Pressable>
      </View>
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
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  reasonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  reasonChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
  },
  reasonChipActive: {
    backgroundColor: '#2563eb',
  },
  reasonText: {
    fontWeight: '600',
    color: '#475569',
    fontSize: 13,
  },
  reasonTextActive: {
    color: '#fff',
  },
  button: {
    backgroundColor: '#dc2626',
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