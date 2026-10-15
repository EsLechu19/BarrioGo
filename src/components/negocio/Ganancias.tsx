import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useColors } from '../../context/ThemeContext';
import type { Colors } from '../../styles/colors';
import type { Pedido } from '../../types/Pedido';
import type { Stats } from './Pedidos';

type Props = {
  stats: Stats;
  pedidos: Pedido[];
};

export function Ganancias({ stats, pedidos }: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const chartData = useMemo(() => getLastSevenDays(pedidos), [pedidos]);
  const hasDeliveredSales: boolean = chartData.some((day) => day.monto > 0);
  return (
    <ScrollView contentContainerStyle={styles.sectionScroll} showsVerticalScrollIndicator={false}>
      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Resumen de ventas</Text>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: colors.primary }]}>
            S/{stats.ventas.toFixed(0)}
          </Text>
          <Text style={styles.statLabel}>Ventas brutas</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: colors.textPrimary }]}>
            S/{stats.entregados > 0 ? (stats.ventas / stats.entregados).toFixed(2) : '0.00'}
          </Text>
          <Text style={styles.statLabel}>Ticket entregado</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: colors.textPrimary }]}>
            {stats.entregados}
          </Text>
          <Text style={styles.statLabel}>Entregados</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: colors.error }]}>
            {stats.cancelados}
          </Text>
          <Text style={styles.statLabel}>Cancelados</Text>
        </View>
      </View>
      <View style={styles.chartCard}>
        <Text style={styles.formTitle}>Últimos 7 días</Text>
        {hasDeliveredSales ? (
          <View style={styles.chartRow}>
            {chartData.map((d) => {
              const max: number = Math.max(...chartData.map((x) => x.monto), 1);
              return (
                <View key={d.clave} style={styles.chartCol}>
                  <Text style={styles.chartValue}>{d.monto.toFixed(0)}</Text>
                  <View style={styles.chartTrack}>
                    <View
                      style={[
                        styles.chartFill,
                        { height: d.monto > 0 ? Math.max(10, (d.monto / max) * 110) : 0 },
                      ]}
                    />
                  </View>
                  <Text style={styles.chartDay}>{d.dia}</Text>
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={styles.chartNote}>
            Todavía no hay ventas entregadas en los últimos 7 días.
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

type ChartDay = { clave: string; dia: string; monto: number };

const ISO_FECHA = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
const DIAS_CORTOS = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

function getLastSevenDays(pedidos: Pedido[]): ChartDay[] {
  const hoy = new Date();
  const dias: ChartDay[] = Array.from({ length: 7 }, (_, index) => {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 6 + index);
    return {
      clave: toLocalKey(fecha),
      dia: DIAS_CORTOS[fecha.getDay()],
      monto: 0,
    };
  });
  const montos = new Map<string, number>(dias.map((dia) => [dia.clave, 0]));

  pedidos.forEach((pedido) => {
    if (pedido.estado !== 'entregado' || !ISO_FECHA.test(pedido.fecha)) return;
    const fecha = new Date(pedido.fecha);
    if (Number.isNaN(fecha.getTime())) return;
    const clave = toLocalKey(fecha);
    if (montos.has(clave)) montos.set(clave, (montos.get(clave) ?? 0) + pedido.total);
  });

  return dias.map((dia) => ({ ...dia, monto: montos.get(dia.clave) ?? 0 }));
}

function toLocalKey(fecha: Date): string {
  return `${fecha.getFullYear()}-${fecha.getMonth()}-${fecha.getDate()}`;
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
