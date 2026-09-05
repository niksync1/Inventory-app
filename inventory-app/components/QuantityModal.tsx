import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { parsePositiveIntegerQuantity } from "../utils/quantity";

interface Props {
  visible: boolean;
  title: string;
  onConfirm: (quantity: number, remarks: string) => void;
  onCancel: () => void;
  confirmLabel?: string;
}

export default function QuantityModal({ visible, title, onConfirm, onCancel, confirmLabel = "Confirm" }: Props) {
  const [quantity, setQuantity] = useState("");
  const [remarks, setRemarks] = useState("");
  const parsedQuantity = parsePositiveIntegerQuantity(quantity);

  function handleConfirm() {
    if (parsedQuantity === null) return;
    onConfirm(parsedQuantity, remarks);
    setQuantity("");
    setRemarks("");
  }

  function handleCancel() {
    setQuantity("");
    setRemarks("");
    onCancel();
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}><View style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        <TextInput style={styles.input} placeholder="Quantity" keyboardType="number-pad" value={quantity} onChangeText={setQuantity} autoFocus />
        <TextInput style={[styles.input, styles.textArea]} placeholder="Remarks (optional)" value={remarks} onChangeText={setRemarks} multiline />
        <View style={styles.actions}>
          <Pressable style={styles.cancelButton} onPress={handleCancel}><Text style={styles.cancelText}>Cancel</Text></Pressable>
          <Pressable style={[styles.confirmButton, parsedQuantity === null && styles.confirmButtonDisabled]} onPress={handleConfirm} disabled={parsedQuantity === null}><Text style={styles.confirmText}>{confirmLabel}</Text></Pressable>
        </View>
      </View></View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.4)", justifyContent: "center", alignItems: "center", padding: 24 },
  card: { width: "100%", backgroundColor: "#fff", borderRadius: 16, padding: 24 },
  title: { fontSize: 20, fontWeight: "700", color: "#0f172a", marginBottom: 16, textAlign: "center" },
  input: { borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16, marginBottom: 12, color: "#0f172a" },
  textArea: { minHeight: 80, textAlignVertical: "top" }, actions: { flexDirection: "row", gap: 12, marginTop: 8 },
  cancelButton: { flex: 1, backgroundColor: "#e2e8f0", borderRadius: 10, paddingVertical: 12, alignItems: "center" }, cancelText: { color: "#0f172a", fontWeight: "600" },
  confirmButton: { flex: 1, backgroundColor: "#2563eb", borderRadius: 10, paddingVertical: 12, alignItems: "center" }, confirmButtonDisabled: { opacity: 0.5 }, confirmText: { color: "#fff", fontWeight: "600" },
});