import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { ActivityIndicator, Button, StyleSheet, Text, View } from "react-native";

type Props = {
  onBarcodeScanned: (barcode: string) => void;
  isEnabled?: boolean;
};

export default function BarcodeScanner({
  onBarcodeScanned,
  isEnabled = true,
}: Props) {
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>
          Camera permission is required to scan barcodes.
        </Text>

        <Button
          title="Grant Permission"
          onPress={requestPermission}
        />
      </View>
    );
  }

  return (
    <CameraView
      style={StyleSheet.absoluteFill}
      facing="back"
      barcodeScannerSettings={{
        barcodeTypes: [
          "ean13",
          "ean8",
          "upc_a",
          "upc_e",
          "code128",
          "code39",
          "qr",
        ],
      }}
      onBarcodeScanned={
        isEnabled
          ? ({ data }) => onBarcodeScanned(data)
          : undefined
      }
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  text: {
    textAlign: "center",
    marginBottom: 20,
    fontSize: 16,
  },
});