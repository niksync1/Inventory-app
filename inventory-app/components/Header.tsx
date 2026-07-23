import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

interface Props {
  title: string;
  showBack?: boolean;
  rightAction?: {
    label: string;
    onPress: () => void;
  };
}

export default function Header({ title, showBack = false, rightAction }: Props) {
  return (
    <View style={styles.header}>
      <View style={styles.left}>
        {showBack ? (
          <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)"))}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
        ) : null}
      </View>

      <Text style={styles.title}>{title}</Text>

      <View style={styles.right}>
        {rightAction ? (
          <Pressable onPress={rightAction.onPress}>
            <Text style={styles.actionText}>{rightAction.label}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: "#f8fafc",
  },
  left: {
    flex: 1,
  },
  right: {
    flex: 1,
    alignItems: "flex-end",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    textAlign: "center",
  },
  backText: {
    color: "#2563eb",
    fontSize: 16,
    fontWeight: "600",
  },
  actionText: {
    color: "#2563eb",
    fontSize: 16,
    fontWeight: "600",
  },
});