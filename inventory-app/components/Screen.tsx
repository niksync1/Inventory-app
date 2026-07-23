import { ReactNode } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";

interface Props {
  children: ReactNode;
  style?: ViewStyle;
  padded?: boolean;
}

export default function Screen({ children, style, padded = true }: Props) {
  return (
    <View style={[styles.screen, padded && styles.padded, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  padded: {
    padding: 24,
  },
});