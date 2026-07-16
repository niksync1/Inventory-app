import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { getSession, signIn, signOut } from './services/auth';
import { useAuthStore } from './store/authStore';
import { getInventorySummary } from './services/inventory';

export default function App() {
  const { user, session, loading, setSession, clearSession, setLoading } = useAuthStore();
  const [email, setEmail] = useState('demo@example.com');
  const [password, setPassword] = useState('password123');
  const [authLoading, setAuthLoading] = useState(false);
  const [summary, setSummary] = useState<{ count: number; lowStock: number } | null>(null);

  useEffect(() => {
    async function bootstrap() {
      setLoading(true);
      const { data, error } = await getSession();

      if (error) {
        console.warn(error.message);
        setLoading(false);
        return;
      }

      setSession(data.session);
      if (data.session?.user) {
        const inventory = await getInventorySummary();
        if (!inventory.error && inventory.data) {
          const lowStock = inventory.data.filter((item) => Number(item.stock_quantity) <= 5).length;
          setSummary({ count: inventory.data.length, lowStock });
        }
      }
    }

    bootstrap();
  }, [setLoading, setSession]);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Validation', 'Please enter your email and password.');
      return;
    }

    setAuthLoading(true);
    const { data, error } = await signIn(email, password);
    setAuthLoading(false);

    if (error) {
      Alert.alert('Login failed', error.message);
      return;
    }

    setSession(data.session);

    const inventory = await getInventorySummary();
    if (!inventory.error && inventory.data) {
      const lowStock = inventory.data.filter((item) => Number(item.stock_quantity) <= 5).length;
      setSummary({ count: inventory.data.length, lowStock });
    }
  }

  async function handleLogout() {
    setAuthLoading(true);
    await signOut();
    setAuthLoading(false);
    clearSession();
    setSummary(null);
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Preparing inventory workspace...</Text>
      </View>
    );
  }

  if (!session?.user) {
    return (
      <View style={styles.container}>
        <StatusBar style="auto" />
        <Text style={styles.title}>Inventory App</Text>
        <Text style={styles.subtitle}>Sprint 1 • Authentication & Dashboard</Text>

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />

        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry
          style={styles.input}
        />

        <Pressable style={styles.button} onPress={handleLogin} disabled={authLoading}>
          {authLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In</Text>}
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.dashboardContainer}>
      <StatusBar style="auto" />
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>{user?.email ?? 'Warehouse user'}</Text>
        </View>
        <Pressable style={styles.secondaryButton} onPress={handleLogout} disabled={authLoading}>
          <Text style={styles.secondaryButtonText}>Logout</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Inventory snapshot</Text>
        <Text style={styles.metric}>{summary?.count ?? 0} products tracked</Text>
        <Text style={styles.metricMuted}>{summary?.lowStock ?? 0} products low on stock</Text>
      </View>

      <View style={styles.grid}>
        <View style={styles.tile}>
          <Text style={styles.tileTitle}>Scan Product</Text>
          <Text style={styles.tileText}>Open barcode scanning from the next sprint.</Text>
        </View>
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
    justifyContent: 'center',
    padding: 24,
  },
  centered: {
    flex: 1,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
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
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  dashboardContainer: {
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
  loadingText: {
    marginTop: 12,
    color: '#475569',
  },
});
