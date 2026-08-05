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
import { router } from 'expo-router';
import { authService } from '../../services/AuthService';
import { useAuthStore } from '../../store/authStore';

export default function ResetPasswordScreen() {
  const { setSession } = useAuthStore();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleUpdate() {
    if (!password || !confirmPassword) {
      Alert.alert('Validation', 'Please enter and confirm your new password.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Validation', 'Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Validation', 'Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await authService.updatePassword(password);
      await authService.signOut();
      setSession(null);
      Alert.alert(
        'Password updated',
        'Your password has been changed. Please sign in with your new password.',
        [{ text: 'OK', onPress: () => router.replace('/') }]
      );
    } catch (error: any) {
      Alert.alert('Password reset failed', error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar />
      <Text style={styles.title}>Set New Password</Text>
      <Text style={styles.subtitle}>
        Enter a new password for your account.
      </Text>

      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="New password"
        secureTextEntry
        style={styles.input}
      />

      <TextInput
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder="Confirm new password"
        secureTextEntry
        style={styles.input}
      />

      <Pressable style={styles.button} onPress={handleUpdate} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Update Password</Text>
        )}
      </Pressable>

      <Pressable onPress={() => router.replace('/')}>
        <Text style={styles.link}>Back to Login</Text>
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#475569',
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
  link: {
    color: '#2563eb',
    textAlign: 'center',
    marginTop: 16,
    fontWeight: '600',
  },
});