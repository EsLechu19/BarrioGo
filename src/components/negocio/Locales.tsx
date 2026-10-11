import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Negocio } from '../../types/Negocio';
import { Establecimiento } from '../../types/Establecimiento';
import { SeccionCard } from '../SeccionCard';
import { InfoBanner } from '../InfoBanner';
import { colors } from '../../styles/colors';

// Sección Locales/establecimientos (solo el local principal es real; el resto
// es mock visual).
const LOCALES_MOCK: Establecimiento[] = [
  { id: 'l2', negocioId: 'preview', nombre: 'Sede Centro', direccion: 'Av. Grau 456, Lima', esPrincipal: false, abierto: true },
  { id: 'l3', negocioId: 'preview', nombre: 'Sede Norte', direccion: 'Av. Universitaria 789, Lima', esPrincipal: false, abierto: false },
];

type Props = {
  negocio: Negocio | null;
  mostrarAviso: boolean;
  onAnadir: () => void;
};

export function Locales({ negocio, mostrarAviso, onAnadir }: Props) {
  return (
    <ScrollView contentContainerStyle={styles.sectionScroll} showsVerticalScrollIndicator={false}>
      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Mis establecimientos</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={onAnadir}
          accessibilityRole="button"
          accessibilityLabel="Añadir establecimiento (diseño)"
        >
          <Ionicons name="add" size={18} color={colors.white} />
          <Text style={styles.addText}>Añadir</Text>
        </TouchableOpacity>
      </View>
      {mostrarAviso ? (
        <InfoBanner texto="Pronto: registrar otra sede para este negocio (solo diseño)." />
      ) : null}
      <SeccionCard
        titulo={negocio?.nombre ?? 'Mi negocio'}
        subtitulo={negocio?.direccion?.trim() ?? 'Dirección por confirmar'}
        foto={negocio?.imagen}
        icono="storefront-outline"
        badgeTexto="Principal"
        badgeColor={colors.primary}
        accionInferior={
          <View style={styles.openRow}>
            <View style={styles.statusDotOpen} />
            <Text style={styles.doneText}>Abierto ahora</Text>
          </View>
        }
      />
      {LOCALES_MOCK.map((local) => (
        <SeccionCard
          key={local.id}
          titulo={local.nombre}
          subtitulo={local.direccion}
          icono="storefront-outline"
          badgeTexto={local.abierto ? 'Abierto' : 'Cerrado'}
          badgeColor={local.abierto ? colors.success : colors.textMuted}
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
  openRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.successSoft,
  },
  statusDotOpen: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
  doneText: { color: colors.success, fontSize: 13, fontWeight: '700' },
});
