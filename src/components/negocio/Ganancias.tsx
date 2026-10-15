import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useColors } from '../../context/ThemeContext';
import type { Colors } from '../../styles/colors';
import type { Stats } from './Pedidos';

// Sección Ganancias: resumen y gráfico semanal (mock visual).
const GANANCIAS_SEMANA: { dia: string; monto: number }[] = [
  { dia: 'L', monto: 120 },
  { dia: 'M', monto: 200 },
  { dia: 'X', monto: 150 },
  { dia: 'J', monto: 260 },
  { dia: 'V', monto: 310 },
  { dia: 'S', monto: 420 },
  { dia: 'D', monto: 280 },
];

type Props = {
  stats: Stats;
  pedidosCount: number;
};

export function Ganancias({ stats, pedidosCount }: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <ScrollView contentContainerStyle={styles.sectionScroll} showsVerticalScrollIndicator={false}>
      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Ganancias</Text>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: colors.primary }]}>
            S/{stats.ventas.toFixed(0)}
          </Text>
          <Text style={styles.statLabel}>Ventas</Text>
        </View>
        <View style={styles.statCard}>
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
        <Text style={styles.formTitle}>Esta semana (muestra)</Text>
        <View style={styles.chartRow}>
          {GANANCIAS_SEMANA.map((d) => {
            const max: number = Math.max(...GANANCIAS_SEMANA.map((x) => x.monto));
            return (
              <View key={d.dia} style={styles.chartCol}>
                <Text style={styles.chartValue}>{d.monto}</Text>
                <View style={styles.chartTrack}>
                  <View
                    style={[
                      styles.chartFill,
                      { height: Math.max(10, (d.monto / max) * 110) },
                    ]}
                  />
                </View>
                <Text style={styles.chartDay}>{d.dia}</Text>
              </View>
            );
          })}
        </View>
        <Text style={styles.chartNote}>
          Diseño: el gráfico real saldrá de tus pedidos por día.
        </Text>
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
    chartNote: { color: c.textMuted, fontSize: 12, textAlign: 'center' },
  });
}
