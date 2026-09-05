import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { inventoryService } from '../../services/InventoryService';
import { parsePositiveIntegerQuantity } from '../../utils/quantity';
import Header from '../../components/Header';
import Screen from '../../components/Screen';

export default function StockInScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [quantity, setQuantity] = useState('');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleStockIn() {
    const qty = parsePositiveIntegerQuantity(quantity);
    if (qty === null) {
      Alert.alert('Validation', 'Quantity must be a positive whole number.');
      return;
    }

    setLoading(true);

    try {
      await inventoryService.stockIn(id!, qty, remarks);
      Alert.alert('Success', `${qty} units added to stock.`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
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
        <Text style={styles.label}>Quantity</Text>
        <TextInput style={styles.input} placeholder="Enter quantity" keyboardType="number-pad" value={quantity} onChangeText={setQuantity} autoFocus />
        <Text style={styles.label}>Remarks (optional)</Text>
        <TextInput style={[styles.input, styles.textArea]} placeholder="Any notes..." value={remarks} onChangeText={setRemarks} multiline />
        <Pressable style={[styles.button, loading && styles.buttonDisabled]} onPress={handleStockIn} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Processing...' : 'Add to Stock'}</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { padding: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16, marginBottom: 16, color: '#0f172a' },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  button: { backgroundColor: '#2563eb', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});