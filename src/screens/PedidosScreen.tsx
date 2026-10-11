import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TabScreenProps } from '../navigation/TabScreenProps';
import { useAuth } from '../context/AuthContext';
import { escucharMisPedidos } from '../services/api';
import { firebaseReady } from '../services/firebase';
import {
  asegurarPermisoNotificaciones,
  notificarCambioEstado,
} from '../services/notificaciones';
import { EstadoPedido, Pedido } from '../types/Pedido';
import { colors } from '../styles/colors';
import { ESTADO_COLORS, ESTADO_ICONS, ESTADO_LABELS } from '../utils/estadosPedido';
import { fechaCorta } from '../utils/fechas';
import { nombreRestaurante } from '../utils/negocios';

type Props = TabScreenProps<'PedidosTab'>;

export default function PedidosScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const uid: string | undefined = user?.uid;
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const estadosPrevios = useRef<Record<string, EstadoPedido>>({});
  const primeraCarga = useRef<boolean>(true);

  useEffect(() => {
    // Permiso al montar. No bloquea el listener: si es false, Pedidos sigue en vivo sin notificar.
    void asegurarPermisoNotificaciones();
  }, []);

  useEffect(() => {
    if (!firebaseReady || !uid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const unsubscribe = escucharMisPedidos(
      uid,
      (data: Pedido[]) => {
        try {
          if (primeraCarga.current) {
            const mapa: Record<string, EstadoPedido> = {};
            for (const p of data) {
              mapa[p.id] = p.estado;
            }
            estadosPrevios.current = mapa;
            primeraCarga.current = false;
          } else {
            for (const p of data) {
              const previo: EstadoPedido | undefined =
                estadosPrevios.current[p.id];
              if (previo !== undefined && previo !== p.estado) {
                void notificarCambioEstado(p.estado);
              }
            }
            const mapa: Record<string, EstadoPedido> = {};
            for (const p of data) {
              mapa[p.id] = p.estado;
            }
            estadosPrevios.current = mapa;
          }
        } catch {
          // Silencioso: un fallo notificando jamás rompe la lista en vivo.
        }
        setPedidos(data);
        setLoading(false);
      },
      (e: Error) => {
        setError(e.message);
        setLoading(false);
      },
    );
    return unsubscribe;
  }, [uid]);

  if (!firebaseReady) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>Mis pedidos</Text>
        <Text style={styles.subtitle}>
          Conectá Firebase (archivo .env) para ver tus pedidos en tiempo real.
        </Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>Mis pedidos</Text>
        <Text style={styles.subtitle}>Iniciá sesión para ver tus pedidos.</Text>
      </View>
    );
  }

  if (loading) {
    // Area loading
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top + 12 }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.subtitle}>Cargando tus pedidos...</Text>
      </View>
    );
  }

  if (pedidos.length === 0 && !error) {
    // Area vacio
    return (
      <View style={[styles.container, styles.centerEmpty, { paddingTop: insets.top + 12 }]}>
        <View style={styles.emptyIcon}>
          <Ionicons name="receipt-outline" size={42} color={colors.primary} />
        </View>
        <Text style={styles.title}>Aún no tienes pedidos</Text>
        <Text style={styles.subtitle}>
          Cuando hagas un pedido, aparecerá aquí.
        </Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Restaurants')}
        >
          <Text style={styles.primaryText}>Descubrir tiendas</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      {/* Area titulo */}
      <Text style={styles.title}>Mis pedidos</Text>
      <Text style={styles.subtitleLeft}>
        {pedidos.length} {pedidos.length === 1 ? 'pedido en total' : 'pedidos en total'}
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {/*Area lista de pedidos*/}
      <FlatList
        data={pedidos}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => {
          const colorEstado: string = ESTADO_COLORS[item.estado];
          return (
            // Card pedido (tocable -> detalle)
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('PedidoDetalle', { pedidoId: item.id })}
              accessibilityRole="button"
              accessibilityLabel={`Ver detalle del pedido de ${nombreRestaurante(item.negocioId)}`}
            >
              {/* Icono estado */}
              <View style={[styles.estadoIcon, { backgroundColor: `${colorEstado}1A` }]}>
                <Ionicons
                  name={ESTADO_ICONS[item.estado]}
                  size={24}
                  color={colorEstado}
                />
              </View>
              {/* Informacion */}
              <View style={styles.cardInfo}>
                <Text style={styles.negocio} numberOfLines={1}>
                  {nombreRestaurante(item.negocioId)}
                </Text>
                <View style={styles.metaRow}>
                  <Ionicons name="calendar-outline" size={13} color={colors.textMuted} />
                  <Text style={styles.meta}>{fechaCorta(item.fecha)}</Text>
                  <Text style={styles.metaDot}>•</Text>
                  <Ionicons name="fast-food-outline" size={13} color={colors.textMuted} />
                  <Text style={styles.meta}>
                    {item.items.length} {item.items.length === 1 ? 'producto' : 'productos'}
                  </Text>
                </View>
                <View style={styles.bottomRow}>
                  <View style={[styles.badge, { backgroundColor: colorEstado }]}>
                    <Text style={styles.badgeText}>{ESTADO_LABELS[item.estado]}</Text>
                  </View>
                  <Text style={styles.total}>S/{item.total.toFixed(2)}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Base
  container: { flex: 1, gap: 4, padding: 16, backgroundColor: colors.background },
  center: { justifyContent: 'center', alignItems: 'center', gap: 8 },
  centerEmpty: { justifyContent: 'center', alignItems: 'center', gap: 10, paddingBottom: 70 },
  subtitle: { color: colors.textMuted, fontSize: 14, textAlign: 'center' },
  subtitleLeft: { color: colors.textMuted, fontSize: 13 },
  error: { color: colors.error, fontSize: 14, fontWeight: '600' },

  // Area titulo
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: '900' },

  // Area vacio
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    marginBottom: 6,
  },

  // Area lista de pedidos
  list: { gap: 4, paddingVertical: 12, paddingBottom: 110 },
  separator: { height: 10 },
  // Card pedido
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  // Icono estado
  estadoIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Informacion
  cardInfo: { flex: 1, gap: 5 },
  negocio: { color: colors.textPrimary, fontSize: 16, fontWeight: '800' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  meta: { color: colors.textMuted, fontSize: 13 },
  metaDot: { color: colors.textMuted, fontSize: 13 },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 2,
  },
  badge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 },
  badgeText: { color: colors.white, fontSize: 12, fontWeight: '800' },
  total: { color: colors.primary, fontSize: 17, fontWeight: '900' },

  // Area confirmar
  primaryButton: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryText: { color: colors.surface, fontSize: 16, fontWeight: '800' },
});
