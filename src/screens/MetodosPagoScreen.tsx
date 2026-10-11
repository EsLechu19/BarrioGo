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

type Props = NativeStackScreenProps<RootStackParamList, 'MetodosPago'>;

interface MetodoMock {
  id: string;
  nombre: string;
  detalle: string;
  icono: 'card-outline' | 'phone-portrait-outline' | 'cash-outline';
}

// TODO(back): métodos reales con pasarela (Yape/Plin/tarjeta) + Firestore.
const METODOS_MOCK: MetodoMock[] = [
  { id: 'm1', nombre: 'Efectivo', detalle: 'Pago al recibir', icono: 'cash-outline' },
  { id: 'm2', nombre: 'Yape', detalle: '999 888 777', icono: 'phone-portrait-outline' },
  { id: 'm3', nombre: 'Visa •• 4321', detalle: 'Vence 08/28', icono: 'card-outline' },
];

export default function MetodosPagoScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [seleccionado, setSeleccionado] = useState<string>('m1');
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

      {METODOS_MOCK.map((m) => {
        const activo: boolean = seleccionado === m.id;
        return (
          <SelectableCard
            key={m.id}
            activo={activo}
            icono={m.icono}
            onPress={() => setSeleccionado(m.id)}
            accessibilityLabel={`Pagar con ${m.nombre}`}
          >
            <Text style={styles.nombre}>{m.nombre}</Text>
            <Text style={styles.detalle}>{m.detalle}</Text>
          </SelectableCard>
        );
      })}

      <Text style={styles.hint}>
        El método elegido se usará al confirmar el carrito (diseño).
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
