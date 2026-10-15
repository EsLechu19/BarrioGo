import { useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Pedido } from '../../types/Pedido';
import { SeccionCard } from '../SeccionCard';
import { useColors } from '../../context/ThemeContext';
import type { Colors } from '../../styles/colors';
import { ESTADO_COLORS, ESTADO_ICONS, SIGUIENTE_ESTADO } from '../../utils/estadosPedido';
import { fechaCorta } from '../../utils/fechas';

// Resumen derivado de los pedidos en vivo.
export type Stats = {
  pendientes: number;
  enCurso: number;
  entregados: number;
  ventas: number;
};

type Props = {
  stats: Stats;
  loadingPedidos: boolean;
  pedidos: Pedido[];
  avanzandoId: string | null;
  onAvanzar: (pedido: Pedido) => void;
};

export function Pedidos({
  stats,
  loadingPedidos,
  pedidos,
  avanzandoId,
  onAvanzar,
}: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <ScrollView
      style={styles.sectionScrollView}
      contentContainerStyle={styles.sectionScroll}
      showsVerticalScrollIndicator={false}
    >
      {/* Resumen */}
      <Text style={styles.sectionTitle}>Mis pedidos</Text>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: '#F59E0B' }]}>{stats.pendientes}</Text>
          <Text style={styles.statLabel}>Pendientes</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: '#8B5CF6' }]}>{stats.enCurso}</Text>
          <Text style={styles.statLabel}>En curso</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: '#10B981' }]}>{stats.entregados}</Text>
          <Text style={styles.statLabel}>Entregados</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: colors.primary }]}>
            S/{stats.ventas.toFixed(0)}
          </Text>
          <Text style={styles.statLabel}>Ventas</Text>
        </View>
      </View>

      {loadingPedidos ? (
        <View style={styles.centerRow}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.subtitle}>Cargando pedidos...</Text>
        </View>
      ) : pedidos.length === 0 ? (
        <View style={styles.centerRow}>
          <Text style={styles.subtitle}>
            Todavía no hay pedidos para tu negocio.
          </Text>
        </View>
      ) : (
        pedidos.map((item) => {
          const colorEstado: string = ESTADO_COLORS[item.estado];
          return (
            <SeccionCard
              key={item.id}
              titulo={`${fechaCorta(item.fecha)} — ${item.items.length} ${
                item.items.length === 1 ? 'item' : 'items'
              }`}
              subtitulo={`S/${item.total.toFixed(2)}`}
              icono={ESTADO_ICONS[item.estado]}
              iconoFondo={`${colorEstado}1A`}
              iconoColor={colorEstado}
              badgeTexto={item.estado.replace('_', ' ')}
              badgeColor={colorEstado}
              accionInferior={
                item.estado !== 'entregado' ? (
                  <TouchableOpacity
                    style={[
                      styles.advanceButton,
                      avanzandoId === item.id && styles.disabledButton,
                    ]}
                    disabled={avanzandoId === item.id}
                    onPress={() => onAvanzar(item)}
                  >
                    <Text style={styles.advanceText}>
                      {avanzandoId === item.id
                        ? 'Actualizando...'
                        : `Avanzar a ${SIGUIENTE_ESTADO[item.estado].replace('_', ' ')}`}
                    </Text>
                    <Ionicons name="arrow-forward" size={16} color={colors.white} />
                  </TouchableOpacity>
                ) : (
                  <View style={styles.doneRow}>
                    <Ionicons
                      name="checkmark-done-outline"
                      size={16}
                      color={colors.success}
                    />
                    <Text style={styles.doneText}>Pedido completado</Text>
                  </View>
                )
              }
            />
          );
        })
      )}
    </ScrollView>
  );
}

function makeStyles(c: Colors) {
  return StyleSheet.create({
    sectionScrollView: { flex: 1 },
    sectionScroll: { gap: 10, paddingBottom: 120 },
    sectionTitle: { color: c.textPrimary, fontSize: 18, fontWeight: '800' },
    subtitle: { color: c.textMuted, fontSize: 14, textAlign: 'center' },

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

    centerRow: { alignItems: 'center', gap: 8, paddingVertical: 12 },
    disabledButton: { opacity: 0.6 },

    advanceButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 11,
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor: c.primary,
    },
    advanceText: { color: c.white, fontSize: 14, fontWeight: '700' },
    doneRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 8,
      borderRadius: 12,
      backgroundColor: c.successSoft,
    },
    doneText: { color: c.success, fontSize: 13, fontWeight: '700' },
  });
}
