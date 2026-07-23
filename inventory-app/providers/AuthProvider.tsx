import { useEffect, type ReactNode } from "react";
import { useAuthStore } from "../store/authStore";
import { ActivityIndicator, Text, View } from "react-native";

interface Props {
  children: ReactNode;
}

export default function AuthProvider({ children }: Props) {
  const { loading } = useAuthStore();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#f8fafc",
        }}
      >
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ marginTop: 12, color: "#475569" }}>
          Preparing inventory workspace...
        </Text>
      </View>
    );
  }

  return <>{children}</>;
}