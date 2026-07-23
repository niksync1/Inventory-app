import { Pressable, StyleSheet, Text, View } from 'react-native';
import Header from '../../components/Header';
import Screen from '../../components/Screen';
import { useSettingsStore } from '../../store/settingsStore';

export default function SettingsScreen() {
  const { soundEnabled, vibrationEnabled, toggleSound, toggleVibration } =
    useSettingsStore();

  return (
    <Screen>
      <Header title="Settings" />
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Scanner</Text>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Sound on scan</Text>
          <Pressable
            style={[styles.toggle, soundEnabled && styles.toggleActive]}
            onPress={toggleSound}
          >
            <View
              style={[
                styles.toggleThumb,
                soundEnabled && styles.toggleThumbActive,
              ]}
            />
          </Pressable>
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Vibrate on scan</Text>
          <Pressable
            style={[styles.toggle, vibrationEnabled && styles.toggleActive]}
            onPress={toggleVibration}
          >
            <View
              style={[
                styles.toggleThumb,
                vibrationEnabled && styles.toggleThumbActive,
              ]}
            />
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  rowLabel: {
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '500',
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#cbd5e1',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleActive: {
    backgroundColor: '#2563eb',
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
});