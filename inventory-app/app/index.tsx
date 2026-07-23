import { useState } from 'react';
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
import { authService } from '../services/AuthService';
import { useAuthStore } from '../store/authStore';

export default function Index() {
  const { setSession } = useAuthStore();
  const [email, setEmail] = useState('demo@example.com');
  const [password, setPassword] = useState('password123');
  const [authLoading, setAuthLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Validation', 'Please enter your email and password.');
      return;
    }

    setAuthLoading(true);

    try {
      const data = await authService.signIn({ email, password });
      setSession(data.session);
    } catch (error: any) {
      Alert.alert('Login failed', error.message);
    } finally {
      setAuthLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar />
      <Text style={styles.title}>Inventory App</Text>

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
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
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
});
