import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootStackParamList';
import { ScreenHeader } from '../components/ScreenHeader';
import { InfoBanner } from '../components/InfoBanner';
import { SelectableCard } from '../components/SelectableCard';
import { colors } from '../styles/colors';
import { METODOS_PAGO_DISPONIBLES } from '../data/checkoutOptions';
import { useCheckout } from '../context/CheckoutContext';

type Props = NativeStackScreenProps<RootStackParamList, 'MetodosPago'>;

export default function MetodosPagoScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { selectedPaymentMethod, setSelectedPaymentMethod } = useCheckout();
  const [aviso, setAviso] = useState<boolean>(false);

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12 }]}>
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader
        titulo="Métodos de pago"
        onBack={() => navigation.goBack()}
        backAccessibilityLabel="Volver al perfil"
        right={
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setAviso(true)}
            accessibilityRole="button"
            accessibilityLabel="Añadir método de pago (diseño)"
          >
            <Ionicons name="add" size={18} color={colors.white} />
            <Text style={styles.addText}>Añadir</Text>
          </TouchableOpacity>
        }
      />

      {aviso ? (
        <InfoBanner texto="Pronto: vincular tarjetas y billeteras reales (solo diseño)." />
      ) : null}

      {METODOS_PAGO_DISPONIBLES.map((m) => {
        const activo: boolean = selectedPaymentMethod?.id === m.id;
        const icono = m.tipo === 'efectivo'
          ? 'cash-outline'
          : m.tipo === 'yape'
            ? 'phone-portrait-outline'
            : 'card-outline';
        return (
          <SelectableCard
            key={m.id}
            activo={activo}
            icono={icono}
            onPress={() => setSelectedPaymentMethod(m)}
            accessibilityLabel={`Pagar con ${m.nombre}`}
          >
            <Text style={styles.nombre}>{m.nombre}</Text>
            <Text style={styles.detalle}>{m.detalle}</Text>
          </SelectableCard>
        );
      })}

      <Text style={styles.hint}>
        Se guardan métodos declarados de demostración; todavía no hay pasarela de pago.
      </Text>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, gap: 10, padding: 16, backgroundColor: colors.background },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  addText: { color: colors.white, fontSize: 13, fontWeight: '800' },
  nombre: { color: colors.textPrimary, fontSize: 16, fontWeight: '800' },
  detalle: { color: colors.textMuted, fontSize: 13 },
  hint: { color: colors.textMuted, fontSize: 12, textAlign: 'center' },
});
