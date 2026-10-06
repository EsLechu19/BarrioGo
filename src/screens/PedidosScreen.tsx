import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootStackParamList';
import { TabParamList } from '../navigation/TabParamList';
import { colors } from '../styles/colors';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'PedidosTab'>,
  NativeStackScreenProps<RootStackParamList>
>;

export default function PedidosScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <Text style={styles.title}>Mis pedidos</Text>
      <Text style={styles.subtitle}>
        Acá vas a ver el estado de tus pedidos en tiempo real (pendiente, confirmado, en
        camino, entregado) cuando conectemos el backend en APF3.
      </Text>
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => navigation.navigate('Tabs', { screen: 'InicioTab' })}
      >
        <Text style={styles.primaryText}>Hacer un pedido</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: 12, padding: 16, backgroundColor: colors.background },
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: '900' },
  subtitle: { color: colors.textMuted, fontSize: 14 },
  primaryButton: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  primaryText: { color: colors.surface, fontSize: 15, fontWeight: '700' },
});
