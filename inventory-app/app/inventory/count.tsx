import { Text, View } from 'react-native';
import Header from '../../components/Header';
import Screen from '../../components/Screen';

export default function CountScreen() {
  return (
    <Screen>
      <Header title="Inventory Count" showBack />
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#64748b', fontSize: 16 }}>
          Inventory counting coming soon.
        </Text>
      </View>
    </Screen>
  );
}