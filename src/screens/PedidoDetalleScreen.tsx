import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/RootStackParamList';
import { useAuth } from '../context/AuthContext';
import { escucharMisPedidos, getNegocioById } from '../services/api';
import { firebaseReady } from '../services/firebase';
import { Pedido } from '../types/Pedido';
import { Negocio } from '../types/Negocio';
import { ScreenHeader } from '../components/ScreenHeader';
import { LoadingState, ErrorState } from '../components/StateView';
import { useColors } from '../context/ThemeContext';
import type { Colors } from '../styles/colors';
import { ESTADO_COLORS, ESTADO_LABELS, PASOS } from '../utils/estadosPedido';
import { fechaLarga } from '../utils/fechas';
import { nombreRestaurante } from '../utils/negocios';

type Props = NativeStackScreenProps<RootStackParamList, 'PedidoDetalle'>;

export default function PedidoDetalleScreen({ navigation, route }: Props) {
  const { pedidoId } = route.params;
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const uid: string | undefined = user?.uid;
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [negocio, setNegocio] = useState<Negocio | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

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
        const found: Pedido | null = data.find((p) => p.id === pedidoId) ?? null;
        setPedido(found);
        setLoading(false);
      },
      (e: Error) => {
        setError(e.message);
        setLoading(false);
      },
    );
    return unsubscribe;
  }, [uid, pedidoId]);

  useEffect(() => {
    if (!pedido) return;
    let activo = true;
    getNegocioById(pedido.negocioId)
      .then((n) => {
        if (activo) setNegocio(n);
      })
      .catch(() => {
        if (activo) setNegocio(null);
      });
    return () => {
      activo = false;
    };
  }, [pedido]);

  if (!firebaseReady || !user) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>Detalle del pedido</Text>
        <Text style={styles.subtitle}>Iniciá sesión para ver el detalle.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.primaryText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <LoadingState
        mensaje="Cargando detalle del pedido..."
        style={[styles.container, styles.center, { paddingTop: insets.top + 12 }]}
        textoStyle={styles.subtitle}
      />
    );
  }

  if (error) {
    return (
      <ErrorState
        mensaje={error}
        style={[styles.container, styles.center, { paddingTop: insets.top + 12 }]}
        textoStyle={styles.subtitle}
        accion={
          <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.goBack()}>
            <Text style={styles.primaryText}>Volver</Text>
          </TouchableOpacity>
        }
      />
    );
  }

  if (!pedido) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>No encontramos ese pedido</Text>
        <Text style={styles.subtitle}>Puede que haya sido eliminado.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.primaryText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const colorEstado: string = ESTADO_COLORS[pedido.estado];
  const nombreNegocio: string =
    negocio?.nombre ?? nombreRestaurante(pedido.negocioId);
  const pasoActual: number = PASOS.indexOf(pedido.estado);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      {/* Header con volver */}
      <ScreenHeader
        titulo={nombreNegocio}
        subtitulo={`Pedido #${pedido.id.slice(0, 6)}`}
        onBack={() => navigation.goBack()}
        backAccessibilityLabel="Volver a mis pedidos"
        backSize={40}
        tituloSize={20}
        tituloNumberOfLines={1}
        style={styles.header}
        right={
          <View style={[styles.badge, { backgroundColor: colorEstado }]}>
            <Text style={styles.badgeText}>{ESTADO_LABELS[pedido.estado]}</Text>
          </View>
        }
      />

      <FlatList
        data={pedido.items}
        keyExtractor={(item) => item.productoId}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            {/* Línea de progreso por estados */}
            <View style={styles.timeline}>
              {PASOS.map((paso, i) => {
                const done: boolean = i <= pasoActual;
                return (
                  <View key={paso} style={styles.paso}>
                    <View
                      style={[
                        styles.pasoDot,
                        { backgroundColor: done ? colors.primary : colors.border },
                      ]}
                    >
                      {done ? (
                        <Ionicons name="checkmark" size={12} color={colors.white} />
                      ) : null}
                    </View>
                    <Text style={[styles.pasoLabel, done && styles.pasoLabelDone]}>
                      {ESTADO_LABELS[paso]}
                    </Text>
                    {i < PASOS.length - 1 ? <View style={styles.pasoLine} /> : null}
                  </View>
                );
              })}
            </View>

            {/* Info general */}
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
                <Text style={styles.meta}>{fechaLarga(pedido.fecha)}</Text>
              </View>
              {negocio?.direccion?.trim() ? (
                <View style={styles.infoRow}>
                  <Ionicons name="location-outline" size={16} color={colors.textMuted} />
                  <Text style={styles.meta}>{negocio.direccion}</Text>
                </View>
              ) : null}
              <View style={styles.infoRow}>
                <Ionicons name="receipt-outline" size={16} color={colors.textMuted} />
                <Text style={styles.meta}>
                  {pedido.items.length}{' '}
                  {pedido.items.length === 1 ? 'producto' : 'productos'}
                </Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Productos</Text>
          </View>
        }
        ListFooterComponent={
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.total}>S/{pedido.total.toFixed(2)}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardInfo}>
              <Text style={styles.dish} numberOfLines={1}>
                {item.nombre?.trim() ? item.nombre : 'Producto'}
              </Text>
              <Text style={styles.meta}>
                {item.cantidad} x S/{item.precioUnitario.toFixed(2)}
              </Text>
            </View>
            <Text style={styles.subtotal}>
              S/{(item.cantidad * item.precioUnitario).toFixed(2)}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

function makeStyles(c: Colors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    center: { justifyContent: 'center', alignItems: 'center', gap: 12, padding: 16 },
    title: { color: c.textPrimary, fontSize: 20, fontWeight: '900' },
    subtitle: { color: c.textMuted, fontSize: 14, textAlign: 'center' },

    header: {
      gap: 10,
      paddingHorizontal: 16,
      paddingBottom: 12,
    },
    badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
    badgeText: { color: c.white, fontSize: 12, fontWeight: '800' },

    list: { paddingHorizontal: 16, paddingBottom: 24 },
    headerBlock: { gap: 12, paddingBottom: 8 },
    separator: { height: 8 },

    timeline: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 8 },
    paso: { flex: 1, alignItems: 'center', gap: 4 },
    pasoDot: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pasoLabel: { color: c.textMuted, fontSize: 10, textAlign: 'center' },
    pasoLabelDone: { color: c.textPrimary, fontWeight: '700' },
    pasoLine: {
      position: 'absolute',
      top: 12,
      left: '60%',
      right: '-40%',
      height: 2,
      backgroundColor: c.border,
    },

    infoCard: {
      gap: 8,
      padding: 14,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      backgroundColor: c.surface,
    },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    meta: { color: c.textMuted, fontSize: 13, flex: 1 },

    sectionTitle: { color: c.textPrimary, fontSize: 17, fontWeight: '800', marginTop: 4 },

    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: 12,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      backgroundColor: c.surface,
    },
    cardInfo: { flex: 1, gap: 2 },
    dish: { color: c.textPrimary, fontSize: 15, fontWeight: '700' },
    subtotal: { color: c.textPrimary, fontSize: 14, fontWeight: '800' },

    totalRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 12,
      padding: 14,
      borderRadius: 16,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    totalLabel: { color: c.textMuted, fontSize: 15, fontWeight: '600' },
    total: { color: c.primary, fontSize: 18, fontWeight: '900' },

    primaryButton: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: c.primary,
    },
    primaryText: { color: c.white, fontSize: 14, fontWeight: '700' },
  });
}
