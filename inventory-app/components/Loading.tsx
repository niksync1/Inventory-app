import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

interface Props {
  message?: string;
}

export default function Loading({ message = "Loading..." }: Props) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#2563eb" />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 24,
  },
  text: {
    marginTop: 12,
    color: "#475569",
    fontSize: 16,
  },
});