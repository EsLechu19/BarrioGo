import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';

// Menú de secciones del panel: botones circulares del mismo tamaño, con badge
// de conteo para las secciones que lo necesitan.
export type Seccion = 'pedidos' | 'menu' | 'ganancias' | 'repartidores' | 'locales';

type IconoSeccion =
  | 'receipt-outline'
  | 'fast-food-outline'
  | 'cash-outline'
  | 'bicycle-outline'
  | 'storefront-outline';

export const SECCIONES: { id: Seccion; titulo: string; icono: IconoSeccion }[] = [
  { id: 'menu', titulo: 'Mi menú', icono: 'fast-food-outline' },
  { id: 'pedidos', titulo: 'Pedidos', icono: 'receipt-outline' },
  { id: 'ganancias', titulo: 'Ganancias', icono: 'cash-outline' },
  { id: 'repartidores', titulo: 'Repartidores', icono: 'bicycle-outline' },
  { id: 'locales', titulo: 'Locales', icono: 'storefront-outline' },
];

type Props = {
  seccion: Seccion;
  conteoPedidos: number;
  conteoMenu: number;
  onSeleccionar: (seccion: Seccion) => void;
};

export function CircleTabBar({
  seccion,
  conteoPedidos,
  conteoMenu,
  onSeleccionar,
}: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.circleScroll}
      contentContainerStyle={styles.circleRow}
    >
      {SECCIONES.map((s) => {
        const activa: boolean = seccion === s.id;
        const conteo: number | null =
          s.id === 'pedidos'
            ? conteoPedidos
            : s.id === 'menu'
              ? conteoMenu
              : null;
        return (
          <TouchableOpacity
            key={s.id}
            style={styles.circleItem}
            onPress={() => onSeleccionar(s.id)}
            accessibilityRole="button"
            accessibilityLabel={`Ver ${s.titulo}`}
          >
            <View style={[styles.circleButton, activa && styles.circleButtonActive]}>
              <Ionicons
                name={s.icono}
                size={26}
                color={activa ? colors.white : colors.primary}
              />
              {conteo !== null && conteo > 0 ? (
                <View style={styles.circleBadge}>
                  <Text style={styles.circleBadgeText}>
                    {conteo > 99 ? '99+' : String(conteo)}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.circleLabel, activa && styles.circleLabelActive]}>
              {s.titulo}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  circleRow: { gap: 12, paddingVertical: 4, paddingHorizontal: 4 },
  circleItem: { alignItems: 'center', gap: 10, width: 88 },
  circleButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  circleButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  circleBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 5,
    borderRadius: 11,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleBadgeText: { color: colors.white, fontSize: 11, fontWeight: '800' },
  circleLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '700', textAlign: 'center' },
  circleLabelActive: { color: colors.primary },
  circleScroll: { flexGrow: 0, flexShrink: 0 },
});
