import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootStackParamList';
import { ScreenHeader } from '../components/ScreenHeader';
import { colors } from '../styles/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Notificaciones'>;

// TODO(back): reemplazar por notificaciones reales del backend (colección
// notifications/{uid}). Por ahora es una lista en memoria (solo diseño).
type Notificacion = {
  id: string;
  icono: keyof typeof Ionicons.glyphMap;
  texto: string;
  hora: string;
};

const NOTIFICACIONES: Notificacion[] = [
  {
    id: '1',
    icono: 'bicycle-outline',
    texto: 'Tu pedido #102 cambió a "en camino"',
    hora: 'hace 2 h',
  },
  {
    id: '2',
    icono: 'checkmark-circle-outline',
    texto: 'Tu pedido #098 fue entregado. ¡Buen provecho!',
    hora: 'ayer',
  },
  {
    id: '3',
    icono: 'pricetag-outline',
    texto: 'Pollería El Buen Sabor tiene 20% de descuento hoy',
    hora: 'hace 2 días',
  },
  {
    id: '4',
    icono: 'star-outline',
    texto: '¿Cómo estuvo tu pedido en Chifa Doña Ana? Dejanos tu opinión',
    hora: 'hace 3 días',
  },
];

export default function NotificacionesScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12 }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          titulo="Notificaciones"
          subtitulo="Novedades de tus pedidos"
          onBack={() => navigation.goBack()}
          backAccessibilityLabel="Volver al inicio"
        />

        <View style={styles.card}>
          {NOTIFICACIONES.map((n, i) => (
            <View key={n.id}>
              {i > 0 ? <View style={styles.divider} /> : null}
              <View style={styles.row}>
                <View style={styles.iconCircle}>
                  <Ionicons name={n.icono} size={20} color={colors.primary} />
                </View>
                <View style={styles.textBlock}>
                  <Text style={styles.texto}>{n.texto}</Text>
                  <Text style={styles.hora}>{n.hora}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.hint}>
          Estas notificaciones son de ejemplo (solo diseño).
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, gap: 12, padding: 16, backgroundColor: colors.background },

  card: {
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  divider: { height: 1, marginLeft: 60, backgroundColor: colors.border },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 10,
    paddingVertical: 13,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: { flex: 1, gap: 2 },
  texto: { color: colors.textPrimary, fontSize: 14, fontWeight: '600', lineHeight: 20 },
  hora: { color: colors.textMuted, fontSize: 12 },

  hint: { color: colors.textMuted, fontSize: 12, textAlign: 'center' },
});
