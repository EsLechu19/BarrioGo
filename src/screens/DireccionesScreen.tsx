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
import { DIRECCIONES_DISPONIBLES } from '../data/checkoutOptions';
import { useCheckout } from '../context/CheckoutContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Direcciones'>;

export default function DireccionesScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { selectedAddress, setSelectedAddress } = useCheckout();
  const [aviso, setAviso] = useState<boolean>(false);

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12 }]}>
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader
        titulo="Direcciones"
        onBack={() => navigation.goBack()}
        backAccessibilityLabel="Volver al perfil"
        right={
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setAviso(true)}
            accessibilityRole="button"
            accessibilityLabel="Añadir dirección (diseño)"
          >
            <Ionicons name="add" size={18} color={colors.white} />
            <Text style={styles.addText}>Añadir</Text>
          </TouchableOpacity>
        }
      />

      {aviso ? (
        <InfoBanner texto="Pronto: guardar nuevas direcciones con GPS (solo diseño)." />
      ) : null}

      {DIRECCIONES_DISPONIBLES.map((d) => {
        const activa: boolean = selectedAddress?.id === d.id;
        return (
          <SelectableCard
            key={d.id}
            activo={activa}
            icono="location-outline"
            onPress={() => setSelectedAddress(d)}
            accessibilityLabel={`Usar dirección ${d.alias}`}
          >
            <View style={styles.aliasRow}>
              <Text style={styles.alias}>{d.alias}</Text>
              {d.esPrincipal ? (
                <View style={styles.principalBadge}>
                  <Text style={styles.principalText}>Principal</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.detalle} numberOfLines={2}>
              {d.detalle}
            </Text>
          </SelectableCard>
        );
      })}

      <Text style={styles.hint}>
        La dirección elegida se usará como entrega en Home y al confirmar el carrito.
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

  aliasRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  alias: { color: colors.textPrimary, fontSize: 16, fontWeight: '800' },
  principalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: colors.primarySoft,
  },
  principalText: { color: colors.primary, fontSize: 11, fontWeight: '800' },
  detalle: { color: colors.textMuted, fontSize: 13 },
  hint: { color: colors.textMuted, fontSize: 12, textAlign: 'center' },
});
