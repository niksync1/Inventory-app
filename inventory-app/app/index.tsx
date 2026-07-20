import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Redirect, router } from 'expo-router';
import { getSession, signIn } from '../services/auth';
import { useAuthStore } from '../store/authStore';

export default function Index() {
  const { session, loading, setSession, setLoading } = useAuthStore();
  const [email, setEmail] = useState('demo@example.com');
  const [password, setPassword] = useState('password123');
  const [authLoading, setAuthLoading] = useState(false);

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
    router.replace('/(tabs)');
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Preparing inventory workspace...</Text>
      </View>
    );
  }

  if (session?.user) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <View style={styles.container}>
      <StatusBar />
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
  loadingText: {
    marginTop: 12,
    color: '#475569',
  },
});