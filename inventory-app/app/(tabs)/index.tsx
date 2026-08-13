import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useInventorySummary } from '../../hooks/useInventory';
import { useLogout } from '../../hooks/useAuth';

export default function TabsIndex() {
  const { user } = useAuthStore();
  const { data: summary, isLoading } = useInventorySummary();
  const logout = useLogout();

  async function handleLogout() {
    try {
      await logout.mutateAsync();
    } catch (error) {
      console.warn('Logout error:', error);
    } finally {
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
        <Pressable
          style={[styles.secondaryButton, logout.isPending && styles.secondaryButtonDisabled]}
          onPress={handleLogout}
          disabled={logout.isPending}
        >
          <Text style={styles.secondaryButtonText}>
            {logout.isPending ? 'Signing out...' : 'Logout'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Inventory snapshot</Text>
        {isLoading ? (
          <Text style={styles.metric}>Loading...</Text>
        ) : (
          <>
            <Text style={styles.metric}>{summary?.count ?? 0} products tracked</Text>
            <Text style={styles.metricMuted}>{summary?.lowStock ?? 0} products low on stock</Text>
          </>
        )}
      </View>

      <View style={styles.grid}>
        <Pressable style={styles.tile} onPress={() => router.push('/(tabs)/scan')}>
          <Text style={styles.tileTitle}>Scan Product</Text>
          <Text style={styles.tileText}>Use the scanner to capture barcodes.</Text>
        </Pressable>
        <Pressable style={styles.tile} onPress={() => router.push('/inventory/receive')}>
          <Text style={styles.tileTitle}>Stock In</Text>
          <Text style={styles.tileText}>Receive new inventory items.</Text>
        </Pressable>
        <Pressable style={styles.tile} onPress={() => router.push('/inventory/adjustments')}>
          <Text style={styles.tileTitle}>Stock Out</Text>
          <Text style={styles.tileText}>Record outbound stock movements.</Text>
        </Pressable>
        <Pressable style={styles.tile} onPress={() => router.push('/inventory/search')}>
          <Text style={styles.tileTitle}>Search</Text>
          <Text style={styles.tileText}>Search products by name, barcode, or category.</Text>
        </Pressable>
        <Pressable style={styles.tile} onPress={() => router.push('/(tabs)/history')}>
          <Text style={styles.tileTitle}>History</Text>
          <Text style={styles.tileText}>View inventory transaction history.</Text>
        </Pressable>
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