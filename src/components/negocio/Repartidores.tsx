import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Repartidor } from '../../types/Repartidor';
import { SeccionCard } from '../SeccionCard';
import { InfoBanner } from '../InfoBanner';
import { colors } from '../../styles/colors';
import { ESTADO_REPARTIDOR_COLOR, ESTADO_REPARTIDOR_LABEL } from '../../utils/estadosPedido';

// Sección Repartidores (datos mock visuales).
const REPARTIDORES_MOCK: Repartidor[] = [
  { id: 'r1', negocioId: 'preview', nombre: 'Juan Pérez', estado: 'en_ruta', entregasHoy: 8, telefono: '999 111 222' },
  { id: 'r2', negocioId: 'preview', nombre: 'Rosa Díaz', estado: 'disponible', entregasHoy: 5, telefono: '999 333 444' },
  { id: 'r3', negocioId: 'preview', nombre: 'Luis Gómez', estado: 'descanso', entregasHoy: 0 },
];

type Props = {
  mostrarAviso: boolean;
  onAnadir: () => void;
};

export function Repartidores({ mostrarAviso, onAnadir }: Props) {
  return (
    <ScrollView contentContainerStyle={styles.sectionScroll} showsVerticalScrollIndicator={false}>
      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>
          Repartidores ({REPARTIDORES_MOCK.length})
        </Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={onAnadir}
          accessibilityRole="button"
          accessibilityLabel="Añadir repartidor (diseño)"
        >
          <Ionicons name="add" size={18} color={colors.white} />
          <Text style={styles.addText}>Añadir</Text>
        </TouchableOpacity>
      </View>
      {mostrarAviso ? (
        <InfoBanner texto="Pronto: invitar repartidores por código (solo diseño)." />
      ) : null}
      {REPARTIDORES_MOCK.map((r) => (
        <SeccionCard
          key={r.id}
          titulo={r.nombre}
          subtitulo={`${r.entregasHoy} entregas hoy${r.telefono ? ` • ${r.telefono}` : ''}`}
          icono="bicycle-outline"
          inicial={r.nombre.trim().charAt(0).toUpperCase()}
          badgeTexto={ESTADO_REPARTIDOR_LABEL[r.estado]}
          badgeColor={ESTADO_REPARTIDOR_COLOR[r.estado]}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  sectionScroll: { gap: 10, paddingBottom: 120 },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '800' },
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
});
