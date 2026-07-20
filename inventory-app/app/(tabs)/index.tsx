import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { signOut } from '../../services/auth';
import { useAuthStore } from '../../store/authStore';
import { getInventorySummary } from '../../services/inventory';

export default function TabsIndex() {
  const { user, clearSession } = useAuthStore();
  const [summary, setSummary] = useState<{ count: number; lowStock: number } | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    async function loadSummary() {
      const inventory = await getInventorySummary();
      if (!inventory.error && inventory.data) {
        const lowStock = inventory.data.filter((item) => Number(item.stock_quantity) <= 5).length;
        setSummary({ count: inventory.data.length, lowStock });
      }
    }

    loadSummary();
  }, []);

  async function handleLogout() {
    if (authLoading) {
      return;
    }

    setAuthLoading(true);

    try {
      const { error } = await signOut();
      if (error) {
        console.warn('Logout warning:', error.message);
      }
    } catch (error) {
      console.warn('Logout error:', error);
    } finally {
      clearSession();
      setAuthLoading(false);
      router.replace('/');
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>{user?.email ?? 'Warehouse user'}</Text>
        </View>
        <Pressable style={[styles.secondaryButton, authLoading && styles.secondaryButtonDisabled]} onPress={handleLogout} disabled={authLoading}>
          <Text style={styles.secondaryButtonText}>{authLoading ? 'Signing out...' : 'Logout'}</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Inventory snapshot</Text>
        <Text style={styles.metric}>{summary?.count ?? 0} products tracked</Text>
        <Text style={styles.metricMuted}>{summary?.lowStock ?? 0} products low on stock</Text>
      </View>

      <View style={styles.grid}>
        <Pressable style={styles.tile} onPress={() => router.push('/(tabs)/scan')}>
          <Text style={styles.tileTitle}>Scan Product</Text>
          <Text style={styles.tileText}>Use the scanner to capture barcodes.</Text>
        </Pressable>
        <View style={styles.tile}>
          <Text style={styles.tileTitle}>Stock In</Text>
          <Text style={styles.tileText}>Prepare stock updates for the next sprint.</Text>
        </View>
        <View style={styles.tile}>
          <Text style={styles.tileTitle}>Stock Out</Text>
          <Text style={styles.tileText}>Review outbound activity and reasons.</Text>
        </View>
        <View style={styles.tile}>
          <Text style={styles.tileTitle}>History</Text>
          <Text style={styles.tileText}>Keep a real audit trail of moves.</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 24,
    paddingTop: 48,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  secondaryButton: {
    backgroundColor: '#e2e8f0',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  secondaryButtonText: {
    color: '#0f172a',
    fontWeight: '600',
  },
  secondaryButtonDisabled: {
    opacity: 0.7,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  metric: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2563eb',
  },
  metricMuted: {
    marginTop: 4,
    color: '#64748b',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  tile: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  tileTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  tileText: {
    color: '#64748b',
    fontSize: 12,
    lineHeight: 18,
  },
});