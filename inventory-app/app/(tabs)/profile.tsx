import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import Screen from "../../components/Screen";
import Header from "../../components/Header";
import Button from "../../components/Button";
import { useAuthStore } from "../../store/authStore";
import { useLogout } from "../../hooks/useAuth";
import { useProfile, useUpdateName } from "../../hooks/useProfile";
import { formatDate } from "../../utils/date";

export default function ProfileScreen() {
  const { user } = useAuthStore();
  const { data: profile, isLoading, isError, refetch } = useProfile();
  const updateName = useUpdateName();
  const logout = useLogout();

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");

  function handleStartEdit() {
    setNameInput(profile?.name ?? "");
    setEditingName(true);
  }

  function handleCancelEdit() {
    setEditingName(false);
    setNameInput("");
  }

  async function handleSaveName() {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      Alert.alert("Validation", "Name cannot be empty.");
      return;
    }

    try {
      await updateName.mutateAsync(trimmed);
      setEditingName(false);
    } catch (error: any) {
      Alert.alert("Error", error.message ?? "Failed to update name.");
    }
  }

  async function handleLogout() {
    try {
      await logout.mutateAsync();
      router.replace("/");
    } catch (error) {
      console.warn("Logout error:", error);
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <Screen>
        <Header title="Profile" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </Screen>
    );
  }

  // Error state
  if (isError) {
    return (
      <Screen>
        <Header title="Profile" />
        <View style={styles.centered}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>Could not load your profile.</Text>
          <Pressable style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  const displayName = profile?.name ?? user?.email?.split("@")[0] ?? "Warehouse User";
  const initials = displayName
    .split(" ")
    .map((s: string) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const roleLabel = profile?.role === "admin" ? "Admin" : "Warehouse";
  const roleColor = profile?.role === "admin" ? "#7c3aed" : "#2563eb";

  return (
    <Screen>
      <Header title="Profile" />

      {/* User Card */}
      <View style={styles.card}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>

        {/* Name */}
        {editingName ? (
          <View style={styles.editNameRow}>
            <TextInput
              style={styles.nameInput}
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="Your name"
              autoFocus
              autoCapitalize="words"
            />
            <Pressable style={styles.cancelBtn} onPress={handleCancelEdit}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.saveBtn, updateName.isPending && { opacity: 0.7 }]}
              onPress={handleSaveName}
              disabled={updateName.isPending}
            >
              <Text style={styles.saveBtnText}>
                {updateName.isPending ? "Saving..." : "Save"}
              </Text>
            </Pressable>
          </View>
        ) : (
          <Pressable style={styles.nameRow} onPress={handleStartEdit}>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.editIcon}>✏️</Text>
          </Pressable>
        )}

        {/* Email */}
        <Text style={styles.email}>{user?.email}</Text>

        {/* Role Badge */}
        <View style={[styles.roleBadge, { backgroundColor: roleColor }]}>
          <Text style={styles.roleBadgeText}>{roleLabel}</Text>
        </View>

        {/* Member Since */}
        {profile?.created_at && (
          <Text style={styles.memberSince}>
            Member since {formatDate(profile.created_at)}
          </Text>
        )}
      </View>

      {/* Settings Row */}
      <Pressable
        style={styles.settingsRow}
        onPress={() => router.push("/settings")}
      >
        <Text style={styles.settingsIcon}>⚙️</Text>
        <Text style={styles.settingsLabel}>Scanner Settings</Text>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      {/* Logout */}
      <View style={styles.logoutSection}>
        <Button
          title={logout.isPending ? "Signing out..." : "Logout"}
          onPress={handleLogout}
          variant="danger"
          disabled={logout.isPending}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: "#64748b",
  },
  errorIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#2563eb",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 24,
    marginTop: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  name: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0f172a",
    marginRight: 8,
  },
  editIcon: {
    fontSize: 16,
  },
  editNameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 8,
  },
  nameInput: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0f172a",
    borderBottomWidth: 2,
    borderBottomColor: "#2563eb",
    paddingVertical: 4,
    paddingHorizontal: 4,
    minWidth: 140,
    textAlign: "center",
  },
  cancelBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  cancelBtnText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "600",
  },
  saveBtn: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  saveBtnText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "600",
  },
  email: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 12,
  },
  roleBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 8,
  },
  roleBadgeText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  memberSince: {
    fontSize: 13,
    color: "#94a3b8",
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginHorizontal: 24,
    marginTop: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  settingsIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  settingsLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: "#0f172a",
  },
  chevron: {
    fontSize: 22,
    color: "#94a3b8",
    fontWeight: "300",
  },
  logoutSection: {
    paddingHorizontal: 24,
    marginTop: 24,
  },
});