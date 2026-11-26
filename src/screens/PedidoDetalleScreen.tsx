import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
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
import {
  actualizarEstadoPago,
  cancelarPedido,
  escucharMisPedidos,
  getNegocioById,
  simularPago,
} from '../services/api';
import { firebaseReady } from '../services/firebase';
import { Pedido } from '../types/Pedido';
import { Negocio } from '../types/Negocio';
import { ScreenHeader } from '../components/ScreenHeader';
import { LoadingState, ErrorState } from '../components/StateView';
import { useColors } from '../context/ThemeContext';
import type { Colors } from '../styles/colors';
import {
  ESTADO_COLORS,
  ESTADO_LABELS,
  ESTADO_PAGO_COLORS,
  ESTADO_PAGO_ICONS,
  ESTADO_PAGO_LABELS,
  PASOS,
} from '../utils/estadosPedido';
import type { EstadoVisible } from '../utils/estadosPedido';
import { fechaLarga } from '../utils/fechas';
import { nombreRestaurante } from '../utils/negocios';
import { consultarPagoPedidoMercadoPago } from '../services/mercadoPago';

type Props = NativeStackScreenProps<RootStackParamList, 'PedidoDetalle'>;

export default function PedidoDetalleScreen({ navigation, route }: Props) {
  const { pedidoId } = route.params;
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const uid: string | undefined = user?.uid;
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [negocio, setNegocio] = useState<Negocio | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Fase 3: reintento del pago simulado (solo visible si estadoPago === 'fallido').
  const [reintentandoPago, setReintentandoPago] = useState<boolean>(false);
  // Fase 4: cancelación de pedidos pendientes desde el detalle.
  const [cancelando, setCancelando] = useState<boolean>(false);
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const loadingInicial = !firebaseReady || !uid;
  const [loading, setLoading] = useState(loadingInicial);
  useEffect(() => {
    if (loadingInicial) return;
    if (!firebaseReady || !uid) return;
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
  }, [uid, pedidoId, loadingInicial]);

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
  const pasosTimeline: EstadoVisible[] =
    pedido.estado === 'cancelado' ? ['cancelado'] : PASOS;
  const pasoActual: number = pasosTimeline.indexOf(pedido.estado);

  // Fase 3: reintenta el pago simulado sobre los pedidos fallidos dados.
  // El reintento siempre aprueba la simulación (tarjeta declinada 1 vez).
  const reintentarPago = async (aActualizar: Pedido[]): Promise<void> => {
    const metodo = aActualizar.find((p) => p.metodoPago)?.metodoPago;
    if (!metodo) {
      Alert.alert(
        'Sin método de pago',
        'Este pedido no tiene un método de pago registrado.',
      );
      return;
    }
    setReintentandoPago(true);
    try {
      const pago = await simularPago(metodo, true);
      if (pago.estado === 'fallido') {
        Alert.alert('Pago no aprobado (simulación)', pago.mensaje);
        return;
      }
      await actualizarEstadoPago(
        aActualizar.map((p) => p.id),
        pago.estado,
      );
    } catch (e) {
      Alert.alert(
        'No se pudo reintentar el pago',
        e instanceof Error ? e.message : 'Intentá de nuevo.',
      );
    } finally {
      setReintentandoPago(false);
    }
  };

  const reanudarPagoMercadoPago = async (): Promise<void> => {
    if (
      pedido.metodoPago?.tipo !== 'mercadopago_sandbox' ||
      pedido.estado !== 'pendiente' ||
      pedido.estadoPago !== 'pendiente' ||
      reintentandoPago
    ) {
      return;
    }
    setReintentandoPago(true);
    try {
      const payment = await consultarPagoPedidoMercadoPago(pedido.id);
      if (payment.status !== 'pending' || !payment.checkoutUrl) {
        throw new Error('No hay un checkout pendiente para reabrir. Consulta el estado antes de volver a intentarlo.');
      }
      navigation.navigate('PagoMercadoPago', { paymentId: payment.paymentId });
    } catch (e) {
      Alert.alert(
        'No se pudo retomar el pago',
        e instanceof Error ? e.message : 'Consulta el estado del pago antes de volver a intentarlo.',
      );
    } finally {
      setReintentandoPago(false);
    }
  };

  // Fase 4: cancela solo los pedidos pendientes dados (nunca toca los ya
  // aceptados). Misma regla del backend que la lista: pendiente → cancelado.
  const confirmarCancelacion = (aCancelar: Pedido[]): void => {
    if (aCancelar.length === 0 || cancelando) return;
    const base: string =
      '¿Seguro que querés cancelar este pedido? Esta acción no se puede deshacer.';
    const pagoNota: string = aCancelar.some((p) => p.estadoPago === 'pagado')
      ? ' El pago fue simulado: no hay dinero real que reembolsar.'
      : '';
    Alert.alert('Cancelar pedido', `${base}${pagoNota}`, [
      { text: 'Seguir con el pedido', style: 'cancel' },
      {
        text: 'Sí, cancelar',
        style: 'destructive',
        onPress: () => {
          setCancelando(true);
          Promise.all(aCancelar.map((p) => cancelarPedido(p.id, uid ?? '')))
            .catch((e: unknown) => {
              Alert.alert(
                'No se pudo cancelar',
                e instanceof Error ? e.message : 'Intentá de nuevo.',
              );
            })
            .finally(() => setCancelando(false));
        },
      },
    ]);
  };

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
              {pasosTimeline.map((paso, i) => {
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
                    {i < pasosTimeline.length - 1 ? <View style={styles.pasoLine} /> : null}
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
              {pedido.metodoPago ? (
                <View style={styles.infoRow}>
                  <Ionicons name="card-outline" size={16} color={colors.textMuted} />
                  <Text style={styles.meta}>
                    {pedido.metodoPago.nombre.trim() || pedido.metodoPago.tipo}
                  </Text>
                </View>
              ) : null}
              {pedido.estadoPago ? (
                <View style={styles.infoRow}>
                  <Ionicons
                    name={ESTADO_PAGO_ICONS[pedido.estadoPago]}
                    size={16}
                    color={ESTADO_PAGO_COLORS[pedido.estadoPago]}
                  />
                  <Text style={styles.meta}>
                    {ESTADO_PAGO_LABELS[pedido.estadoPago]}
                  </Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.sectionTitle}>Productos</Text>
          </View>
        }
        ListFooterComponent={
          <View>
            {typeof pedido.envio === 'number' && pedido.envio > 0 ? (
              <>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Subtotal</Text>
                  <Text style={styles.subtotal}>
                    S/{(pedido.total - pedido.envio).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.envioLabel}>Envío</Text>
                  <Text style={styles.envioValue}>S/{pedido.envio.toFixed(2)}</Text>
                </View>
              </>
            ) : null}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.total}>S/{pedido.total.toFixed(2)}</Text>
            </View>
            {pedido.estadoPago === 'fallido' && pedido.metodoPago?.tipo !== 'mercadopago_sandbox' ? (
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => void reintentarPago([pedido])}
                disabled={reintentandoPago}
              >
                <Text style={styles.primaryText}>
                  {reintentandoPago ? 'Procesando pago...' : 'Reintentar pago'}
                </Text>
              </TouchableOpacity>
            ) : null}
            {pedido.estado === 'pendiente' &&
            pedido.estadoPago === 'pendiente' &&
            pedido.metodoPago?.tipo === 'mercadopago_sandbox' ? (
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => void reanudarPagoMercadoPago()}
                disabled={reintentandoPago}
              >
                <Text style={styles.primaryText}>
                  {reintentandoPago ? 'Abriendo pago...' : 'Retomar pago en Mercado Pago'}
                </Text>
              </TouchableOpacity>
            ) : null}
            {pedido.estado === 'pendiente' ? (
              <TouchableOpacity
                style={[styles.dangerButton, cancelando && styles.dangerButtonDisabled]}
                onPress={() => confirmarCancelacion([pedido])}
                disabled={cancelando}
              >
                <Text style={styles.dangerText}>
                  {cancelando ? 'Cancelando...' : 'Cancelar pedido'}
                </Text>
              </TouchableOpacity>
            ) : null}
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
    envioValue: { color: c.success, fontSize: 14, fontWeight: '800' },
    envioLabel: { color: c.success, fontSize: 14, fontWeight: '600' },

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

    // Fase 3: reintento del pago simulado (visible solo si el pago falló).
    retryButton: {
      width: '100%',
      marginTop: 8,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.primary,
    },

    // Fase 4: cancelar pedido(s) pendiente(s) desde el detalle.
    dangerButton: {
      width: '100%',
      marginTop: 8,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: c.error,
      backgroundColor: c.surface,
    },
    dangerButtonDisabled: { opacity: 0.6 },
    dangerText: { color: c.error, fontSize: 14, fontWeight: '800' },
  });
}
