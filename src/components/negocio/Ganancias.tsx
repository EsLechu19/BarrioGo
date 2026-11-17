import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '../EmptyState';
import { useColors } from '../../context/ThemeContext';
import type { Colors } from '../../styles/colors';
import type { Stats } from './Pedidos';

// Sección Ganancias: resumen + gráfico de las ventas REALES de la semana
// (lun→dom). Los montos por día los calcula NegocioScreen; vacío si no hay.
const DIAS: string[] = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

type Props = {
  stats: Stats;
  pedidosCount: number;
  // Ventas entregadas por día de la semana actual (índice 0 = lunes).
  ventasSemana: number[];
};

export function Ganancias({ stats, pedidosCount, ventasSemana }: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const totalSemana: number = ventasSemana.reduce((acc, v) => acc + v, 0);
  const maxDia: number = Math.max(...ventasSemana, 1);
  return (
    <ScrollView contentContainerStyle={styles.sectionScroll} showsVerticalScrollIndicator={false}>
      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Ganancias</Text>
      </View>
      <View style={styles.statsRow}>
        <View style={[styles.statCard, styles.statCardDinero]}>
          <Text
            style={[styles.statNum, { color: colors.primary }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            S/{stats.ventas.toFixed(2)}
          </Text>
          <Text style={styles.statLabel}>Ventas</Text>
        </View>
        <View style={[styles.statCard, styles.statCardDinero]}>
          <Text style={[styles.statNum, { color: colors.textPrimary }]}>
            S/{pedidosCount > 0 ? (stats.ventas / pedidosCount).toFixed(2) : '0.00'}
          </Text>
          <Text style={styles.statLabel}>Ticket prom.</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: colors.textPrimary }]}>
            {pedidosCount}
          </Text>
          <Text style={styles.statLabel}>Pedidos</Text>
        </View>
      </View>
      <View style={styles.chartCard}>
        <Text style={styles.formTitle}>Esta semana</Text>
        {totalSemana > 0 ? (
          <View style={styles.chartRow}>
            {ventasSemana.map((monto, i) => (
              <View key={DIAS[i]} style={styles.chartCol}>
                <Text
                  style={styles.chartValue}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.6}
                >
                  {monto.toFixed(2)}
                </Text>
                <View style={styles.chartTrack}>
                  <View
                    style={[
                      styles.chartFill,
                      { height: Math.max(10, (monto / maxDia) * 110) },
                    ]}
                  />
                </View>
                <Text style={styles.chartDay}>{DIAS[i]}</Text>
              </View>
            ))}
          </View>
        ) : (
          <EmptyState
            icono="bar-chart-outline"
            titulo="Aún no hay ventas esta semana"
            subtitulo="Los pedidos entregados de esta semana van a aparecer acá."
            style={styles.empty}
          />
        )}
      </View>
    </ScrollView>
  );
}

function makeStyles(c: Colors) {
  return StyleSheet.create({
    sectionScroll: { gap: 10, paddingBottom: 120 },
    sectionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    sectionTitle: { color: c.textPrimary, fontSize: 18, fontWeight: '800' },

    statsRow: { flexDirection: 'row', gap: 8 },
    statCard: {
      flex: 1,
      alignItems: 'center',
      gap: 2,
      paddingVertical: 10,
      paddingHorizontal: 4,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      backgroundColor: c.surface,
    },
    // Cajas con montos (ej. S/1000.00): más ancho que el contador de pedidos.
    statCardDinero: { flex: 1.5 },
    statNum: { fontSize: 18, fontWeight: '900', color: c.textPrimary },
    statLabel: { color: c.textMuted, fontSize: 11, fontWeight: '600' },

    chartCard: {
      gap: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 18,
      backgroundColor: c.surface,
    },
    formTitle: { color: c.textPrimary, fontSize: 16, fontWeight: '800' },
    chartRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
    chartCol: { flex: 1, alignItems: 'center', gap: 4 },
    chartValue: { color: c.textMuted, fontSize: 10, fontWeight: '700' },
    chartTrack: {
      width: '100%',
      height: 120,
      justifyContent: 'flex-end',
      alignItems: 'center',
      borderRadius: 8,
      backgroundColor: c.background,
    },
    chartFill: { width: '70%', borderRadius: 6, backgroundColor: c.primary },
    chartDay: { color: c.textMuted, fontSize: 12, fontWeight: '700' },
    empty: { paddingVertical: 12 },
  });
}
