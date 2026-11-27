import { Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useRef, useState } from 'react';
import { RootStackParamList } from '../navigation/RootStackParamList';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useEstadoNegocios } from '../context/EstadoNegociosContext';
import {
  crearPedidos,
  getNegocioById,
  getNombreUsuario,
  simularPago,
} from '../services/api';
import { estaAbierto, proximaAperturaTexto, costoEnvioANegocio } from '../utils/negocios';
import { LIST_PERF } from '../utils/listPerf';
import { storage } from '../services/storage';
import { registrarCambioEstado } from '../services/notificaciones';
import { registrarPushToken } from '../services/pushNotifications';
import {
  aDireccionPedido,
  cargarDireccionCheckout,
  cargarDirecciones,
  direccionSeleccionadaId,
} from '../utils/direcciones';
import { confirm } from '../utils/confirm';
import { ScreenHeader } from '../components/ScreenHeader';
import { CantidadStepper } from '../components/CantidadStepper';
import { useColors } from '../context/ThemeContext';
import type { Colors } from '../styles/colors';
import type { DireccionUsuario } from '../types/Direccion';
import { UbicacionModal } from '../components/UbicacionModal';
import * as WebBrowser from 'expo-web-browser';
import { crearPagoMercadoPago, verificarElegibilidadMercadoPago } from '../services/mercadoPago';

type Props = NativeStackScreenProps<RootStackParamList, 'Carrito'>;

export default function CarritoScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { items, total, setCantidad, remove, clear } = useCart();
  const { user } = useAuth();
  const { conOverride } = useEstadoNegocios();
  const [enviando, setEnviando] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [direcciones, setDirecciones] = useState<DireccionUsuario[]>([]);
  const [direccionActual, setDireccionActual] = useState<DireccionUsuario | null>(null);
  const [modalDirecciones, setModalDirecciones] = useState<boolean>(false);
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  // Alerta clásica al retroceder con productos: cancelar la compra o
  // seguir viendo (va a Todos los restaurantes). Vacío: sale sin preguntar.
  const permitirSalida = useRef<boolean>(false);

  useEffect(() => {
    const offSalida = navigation.addListener('beforeRemove', (e) => {
      if (items.length === 0 || permitirSalida.current) return;
      e.preventDefault();
      const platos: string =
        items.length === 1 ? '1 producto' : `${items.length} productos`;
      void confirm({
        title: '¿Cancelar la compra?',
        message: `Todavía tienes ${platos} en el carrito. ¿Salimos y se cancela, o sigues viendo más comida?`,
        confirmText: 'Sí, cancelar',
        cancelText: 'Seguir viendo',
        destructive: true,
      }).then((cancelar) => {
        if (!cancelar) {
          permitirSalida.current = true;
          // "Seguir viendo": volvemos a la pantalla anterior (Detalle o el
          // Tabs de donde vinimos), sin vaciar el carrito.
          navigation.dispatch(e.data.action);
          return;
        }
        clear();
        navigation.dispatch(e.data.action);
      });
    });
    // Al volver al carrito se reactiva la pregunta.
    const offFoco = navigation.addListener('focus', () => {
      permitirSalida.current = false;
    });
    return () => {
      offSalida();
      offFoco();
    };
  }, [navigation, items, clear]);

  useEffect(() => {
    const usuarioId = user?.uid;
    if (!usuarioId) return;
    let activo = true;
    const recargarDireccion = async (): Promise<void> => {
      const [lista, activa] = await Promise.all([
        cargarDirecciones(usuarioId),
        cargarDireccionCheckout(usuarioId),
      ]);
      if (!activo) return;
      setDirecciones(lista);
      const id = direccionSeleccionadaId(lista, activa);
      setDireccionActual(id ? (lista.find((d) => d.id === id) ?? null) : null);
    };
    const offFoco = navigation.addListener('focus', () => void recargarDireccion());
    void recargarDireccion();
    return () => {
      activo = false;
      offFoco();
    };
  }, [navigation, user?.uid]);

  const elegirDireccionRapida = (direccion: DireccionUsuario): void => {
    setDireccionActual(direccion);
    setModalDirecciones(false);
    if (user) void storage.saveCheckoutAddress(user.uid, aDireccionPedido(direccion));
  };

  const guardarDireccionNueva = (nueva: DireccionUsuario): void => {
    const lista = [...direcciones, nueva];
    setDirecciones(lista);
    setDireccionActual(nueva);
    setModalDirecciones(false);
    if (user) {
      void storage.saveAddresses(user.uid, lista);
      void storage.saveCheckoutAddress(user.uid, aDireccionPedido(nueva));
    }
  };

  const detallado = useMemo(
    () => items,
    [items],
  );

  const negocioIds: string[] = useMemo(() => {
    const ids = new Set<string>();
    for (const item of items) {
      if (item.negocioId?.trim()) ids.add(item.negocioId);
    }
    return Array.from(ids);
  }, [items]);

  // Costo de envío por negocio (0 = gratis/sin costo). Se carga del negocio
  // real para cobrarlo en el total y mostrarlo en el desglose.
  const [costosEnvio, setCostosEnvio] = useState<Record<string, number>>({});
  useEffect(() => {
    if (negocioIds.length === 0) return;
    let activo = true;
    Promise.all(negocioIds.map((id) => getNegocioById(id)))
      .then((negocios) => {
        if (!activo) return;
        const mapa: Record<string, number> = {};
        for (const negocio of negocios) {
          if (negocio) mapa[negocio.id] = costoEnvioANegocio(negocio);
        }
        setCostosEnvio(mapa);
      })
      .catch(() => {
        // Sin red: sin costo de envío cargado (no se cobra hasta poder leerlo).
      });
    return () => {
      activo = false;
    };
  }, [negocioIds]);

  // Envío total a cobrar (suma de todos los negocios del carrito).
  const envioTotal: number = useMemo(
    () =>
      negocioIds.reduce((acc, id) => acc + (costosEnvio[id] ?? 0), 0),
    [negocioIds, costosEnvio],
  );
  const totalConEnvio: number = total + envioTotal;

  // Lógica APF2 intacta: el pedido guarda el total de productos, sin
  // cargos extra (unión apf2-ui: solo cambió el diseño).
  const handleConfirmar = async (): Promise<void> => {
    setErrorMsg(null);
    if (!user) {
      setErrorMsg('Iniciá sesión para confirmar tu pedido.');
      return;
    }
    const usuarioId: string = user.uid;
    if (items.length === 0) {
      setErrorMsg('El carrito está vacío.');
      return;
    }
    if (items.some((item) => !item.negocioId?.trim())) {
      setErrorMsg('Hay un producto antiguo sin restaurante. Volvé a agregarlo desde su menú.');
      return;
    }
    if (negocioIds.length === 0) {
      setErrorMsg('No se pudo determinar el restaurante del pedido.');
      return;
    }
    if (!(total > 0)) {
      setErrorMsg('El total del pedido no es válido.');
      return;
    }
    const [direccion, metodoPago, clienteNombre, ...negocios] = await Promise.all([
      cargarDireccionCheckout(usuarioId),
      storage.loadCheckoutPayment(usuarioId),
      getNombreUsuario(usuarioId),
      ...negocioIds.map((id) => getNegocioById(id)),
    ]);
    // Re-chequeo al confirmar: cada negocio pudo cerrar mientras el cliente
    // tenía el carrito abierto (horario o override del dueño).
    for (const negocio of negocios) {
      if (negocio && !estaAbierto(conOverride(negocio))) {
        const negocioVista = conOverride(negocio);
        const apertura: string | null = proximaAperturaTexto(negocioVista);
        setErrorMsg(
          apertura
            ? `${negocio.nombre} está cerrado. ${apertura}.`
            : `${negocio.nombre} está cerrado ahora. Intentá más tarde.`,
        );
        return;
      }
    }
    if (!direccion) {
      setErrorMsg('Seleccioná una dirección antes de confirmar tu pedido.');
      navigation.navigate('Direcciones');
      return;
    }
    if (!metodoPago) {
      setErrorMsg('Seleccioná un método de pago antes de confirmar tu pedido.');
      navigation.navigate('MetodosPago');
      return;
    }
    const nombresNegocio: Record<string, string> = {};
    for (const negocio of negocios) {
      if (negocio?.nombre?.trim()) nombresNegocio[negocio.id] = negocio.nombre.trim();
    }
    // Envío real por negocio (recién leído): el cobrado debe coincidir con lo mostrado.
    const envios: Record<string, number> = {};
    for (const negocio of negocios) {
      if (!negocio) continue;
      const costo: number = costoEnvioANegocio(negocio);
      if (costo > 0) envios[negocio.id] = costo;
    }
    const totalFinal: number =
      Math.round(
        (total + Object.values(envios).reduce((a, c) => a + c, 0)) * 100,
      ) / 100;
    setEnviando(true);
    let pedidosMPGuardados: boolean = false;
    try {
      const esMercadoPagoSandbox: boolean = metodoPago.tipo === 'mercadopago_sandbox';
      if (esMercadoPagoSandbox) {
        // Verify the Firebase ID token's server-attested email claim before
        // persisting orders that could otherwise be stranded without a payer.
        await verificarElegibilidadMercadoPago();
      }
      // Keep the established simulations unchanged. Mercado Pago remains
      // pending until the backend verifies an official provider notification.
      const pago = esMercadoPagoSandbox
        ? { estado: 'pendiente' as const, mensaje: 'El pago de prueba sigue pendiente.' }
        : await simularPago(metodoPago, false);
      const pedidosCreados = await crearPedidos({
        usuarioId,
        items,
        total: totalFinal,
        envios,
        direccion,
        metodoPago,
        ...(clienteNombre ? { clienteNombre } : {}),
        nombresNegocio,
        estadoPago: pago.estado,
      });
      pedidosMPGuardados = esMercadoPagoSandbox;
      let paymentId: string | null = null;
      if (esMercadoPagoSandbox) {
        const payment = await crearPagoMercadoPago(pedidosCreados.map((pedido) => pedido.id));
        if (!payment.checkoutUrl) throw new Error('Mercado Pago no devolvió la dirección de checkout.');
        paymentId = payment.paymentId;
        try {
          await WebBrowser.openAuthSessionAsync(
            payment.checkoutUrl,
            `barriogo://checkout-return?paymentId=${encodeURIComponent(payment.paymentId)}`,
          );
        } catch {
          // The provider order remains pending; closing or failing to open the
          // browser must never be interpreted as a failed payment.
        }
      }
      // Registra el token una sola vez, justo cuando el usuario acepta el
      // permiso que se pide en el primer pedido.
      let tokenSolicitado = false;
      const registrarToken = (): void => {
        if (tokenSolicitado) return;
        tokenSolicitado = true;
        void registrarPushToken(usuarioId);
      };
      // Aviso local de "pedido realizado" por cada pedido del carrito. No
      // bloquea el checkout: si el SO o el historial fallan, el pedido ya
      // está creado y el cliente no debe ver un error.
      for (const pedido of pedidosCreados) {
        void registrarCambioEstado(
          usuarioId,
          { id: pedido.id, estado: 'pendiente' },
          'nuevo',
          registrarToken,
        ).catch(() => {
          // Silencioso: el pedido ya está confirmado en Firestore.
        });
      }
      clear();
      if (paymentId) {
        navigation.navigate('PagoMercadoPago', { paymentId });
        return;
      }
      if (pago.estado === 'fallido') {
        Alert.alert(
          'Pago no aprobado (simulación)',
          `${pago.mensaje} Tu pedido quedó guardado; podés reintentar el pago desde el detalle del pedido.`,
        );
      }
      navigation.navigate('Tabs', { screen: 'PedidosTab' });
    } catch (e) {
      if (pedidosMPGuardados) {
        clear();
        navigation.navigate('Tabs', { screen: 'PedidosTab' });
        Alert.alert(
          'Pedido guardado',
          e instanceof Error
            ? e.message
            : 'No se pudo iniciar el pago. Tus pedidos siguen pendientes; no los vuelvas a crear y consulta su estado antes de reintentar.',
        );
        return;
      }
      setErrorMsg(
        e instanceof Error
          ? e.message
          : 'No se pudo crear el pedido. Intentá de nuevo.',
      );
    } finally {
      setEnviando(false);
    }
  };

  // Rama defensiva: App.tsx solo monta este stack con sesión iniciada, pero
  // si la sesión cae con el carrito abierto no se crea ningún pedido fantasma.
  if (!user) {
    // Area login
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>Iniciá sesión para confirmar</Text>
        <Text style={styles.subtitle}>
          Necesitás una cuenta para crear pedidos y ver su seguimiento.
        </Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Tabs', { screen: 'InicioTab' })}
        >
          <Text style={styles.primaryText}>Ir al inicio</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (items.length === 0) {
    // Area vacio: texto arriba, llama al medio de todo, botones abajo.
    return (
      <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
        <View style={styles.emptyTop}>
          <View style={styles.emptyIcon}>
            <Ionicons name="cart-outline" size={42} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Carrito vacio</Text>
        </View>
        <View style={styles.emptyMiddle}>
          <Image
            source={require('../../assets/img/llamacarrito.png')}
            style={styles.emptyImage}
            resizeMode="contain"
          />
        </View>
        <View style={[styles.emptyBottom, { paddingBottom: insets.bottom + 20 }]}>
          <Text style={styles.subtitle}>Agrega algo rico del menú de un restaurante.</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('Tabs', { screen: 'InicioTab' })}>
            <Text style={styles.primaryText}>Explorar restaurantes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ghostButton} onPress={() => navigation.replace('Restaurants')}>
            <Text style={styles.ghostText}>Ver todos</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      {/* Area titulo */}
      <ScreenHeader
        titulo="Mi carrito"
        onBack={() => navigation.goBack()}
        backAccessibilityLabel="Volver"
        style={styles.header}
      />

      <View style={styles.divider} />

      {/*Area lista de restaurante*/}
      <FlatList
        data={detallado}
        keyExtractor={(item) => item.productoId}
        {...LIST_PERF}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          // Card producto
          <View style={styles.row}>
            {/* Foto a la izquierda */}
            {item.imagen?.trim() ? (
              <Image
                source={{ uri: item.imagen }}
                style={styles.thumb}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.thumb, styles.thumbPlaceholder]}>
                <Ionicons name="fast-food-outline" size={26} color={colors.textPlaceholder} />
              </View>
            )}
            {/*Informacion */}
            <View style={styles.info}>
              <Text style={styles.name}>
                {item.nombre?.trim() ? item.nombre : 'Producto'}
              </Text>
              {item.descripcion?.trim() ? (
                <Text style={styles.desc} numberOfLines={2}>
                  {item.descripcion}
                </Text>
              ) : null}
              <Text style={styles.unit}>
                S/{item.precioUnitario.toFixed(2)} c/u
              </Text>
            </View>
            {/* Columna derecha: stepper + precio + tacho (borra todo directo) */}
            <View style={styles.rightCol}>
              {/* Fila cantidad + tacho */}
              <View style={styles.stepperRow}>
                <CantidadStepper
                  cantidad={item.cantidad}
                  onDecrement={() =>
                    setCantidad(item.productoId, item.cantidad - 1)
                  }
                  onIncrement={() =>
                    setCantidad(item.productoId, item.cantidad + 1)
                  }
                  colorTexto={colors.textPrimary}
                  colorTextoPlus={colors.white}
                />
                <TouchableOpacity
                  style={styles.trashButton}
                  onPress={() => remove(item.productoId)}
                  accessibilityLabel={`Eliminar ${item.nombre ?? 'producto'} del carrito`}
                  accessibilityRole="button"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
              <Text style={styles.price}>
                S/{(item.precioUnitario * item.cantidad).toFixed(2)}
              </Text>
            </View>
          </View>
        )}
      />
      {/* Area total: productos + envío (si algún negocio lo cobra). */}
      <View style={styles.footer}>
        <View style={styles.addressCard}>
          <View style={styles.addressInfo}>
            <Ionicons name="location-outline" size={20} color={colors.primary} />
            <View style={styles.addressTextBlock}>
              <Text style={styles.addressLabel}>Entregar en</Text>
              <Text style={styles.addressTitle} numberOfLines={1}>
                {direccionActual?.alias ?? 'Seleccioná una dirección'}
              </Text>
              {direccionActual ? (
                <Text style={styles.addressDetail} numberOfLines={1}>
                  {direccionActual.detalle}
                </Text>
              ) : null}
            </View>
          </View>
          <TouchableOpacity
            onPress={() => setModalDirecciones(true)}
            accessibilityRole="button"
            accessibilityLabel="Cambiar dirección de entrega"
          >
            <Text style={styles.changeAddress}>Cambiar</Text>
          </TouchableOpacity>
        </View>
        {/* Subtotal + envío (solo si hay costo de envío) */}
        {envioTotal > 0 ? (
          <>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.subValue}>S/{total.toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.envioLabel}>Envío</Text>
              <Text style={styles.envioValue}>S/{envioTotal.toFixed(2)}</Text>
            </View>
          </>
        ) : null}
        {/* Fila total */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>S/{totalConEnvio.toFixed(2)}</Text>
        </View>
        {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}
        <TouchableOpacity
          style={[styles.primaryButton, enviando ? styles.primaryButtonDisabled : null]}
          onPress={handleConfirmar}
          disabled={enviando}
        >
          <Text style={styles.primaryText}>
            {enviando ? 'Enviando...' : 'Confirmar pedido'}
          </Text>
        </TouchableOpacity>
      </View>
      <UbicacionModal
        visible={modalDirecciones}
        direcciones={direcciones}
        seleccionadaId={direccionActual?.id ?? null}
        onCerrar={() => setModalDirecciones(false)}
        onElegir={elegirDireccionRapida}
        onGuardar={guardarDireccionNueva}
      />
    </View>
  );
}

function makeStyles(c: Colors) {
  return StyleSheet.create({
    // Base
    container: { flex: 1, padding: 16, backgroundColor: c.background },
    center: { justifyContent: 'center', alignItems: 'center', gap: 8 },
    centerEmpty: { justifyContent: 'center', alignItems: 'center', gap: 10 },
    emptyTop: { alignItems: 'center', gap: 10 },
    emptyTitle: { color: c.textPrimary, fontSize: 22, fontWeight: '900', textAlign: 'center' },
    emptyMiddle: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyBottom: { gap: 10 },
    emptyIcon: {
      width: 96,
      height: 96,
      borderRadius: 48,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: c.primarySoft,
      marginBottom: 6,
    },
    emptyImage: { width: 300, height: 300 },
    title: { flex: 1, color: c.textPrimary, fontSize: 22, fontWeight: '900' },
    ghostButton: {
      width: '100%',
      paddingVertical: 14,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: c.primary,
      backgroundColor: c.surface,
    },
    ghostText: { color: c.primary, fontSize: 15, fontWeight: '800' },
    subtitle: { color: c.textMuted, fontSize: 14, textAlign: 'center' },
    divider: { height: 1, backgroundColor: c.border},

    // Area titulo
    header: { paddingBottom: 15 },

    // Area lista de restaurante
    list: { gap: 4, paddingVertical: 12 },
    separator: { height: 8 },
    // Card producto
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      backgroundColor: c.surface,
    },
    // Informacion
    info: { flex: 1, gap: 4, justifyContent: 'center' },
    name: { color: c.textPrimary, fontSize: 15, fontWeight: '700' },
    desc: { color: c.textMuted, fontSize: 13 },
    unit: { color: c.textMuted, fontSize: 13 },
    // Columna derecha
    rightCol: { alignItems: 'flex-end', gap: 6 },
    stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    thumb: { width: 72, height: 72, borderRadius: 14, backgroundColor: c.border },
    thumbPlaceholder: {
      backgroundColor: c.background,
      borderWidth: 1,
      borderColor: c.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    price: { alignSelf: 'stretch', textAlign: 'center', color: c.primary, fontSize: 16, fontWeight: '800' },
    trashButton: {
      padding: 6,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },

    // Area total
    footer: { gap: 10, paddingTop: 8 },
    addressCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface },
    addressInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0 },
    addressTextBlock: { flex: 1, gap: 1, minWidth: 0 },
    addressLabel: { color: c.textMuted, fontSize: 12 },
    addressTitle: { color: c.textPrimary, fontSize: 14, fontWeight: '800' },
    addressDetail: { color: c.textMuted, fontSize: 12 },
    changeAddress: { color: c.primary, fontSize: 13, fontWeight: '800' },
    // Fila total
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    totalLabel: { fontSize: 15, fontWeight: '600', color: c.textSecondary },
    subValue: { fontSize: 15, fontWeight: '700', color: c.textPrimary },
    envioValue: { fontSize: 15, fontWeight: '800', color: c.success },
    envioLabel: { fontSize: 15, fontWeight: '600', color: c.success },
    freeValue: { fontSize: 15, fontWeight: '800', color: c.success },
    totalValue: { fontSize: 20, fontWeight: '900', color: c.primary },
    error: { color: c.error, fontSize: 14, fontWeight: '600' },
    // Area confirmar
    primaryButton: {
      width: '100%',
      paddingVertical: 15,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.primary,
      shadowColor: c.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    primaryButtonDisabled: { opacity: 0.6 },
    primaryText: { color: c.white, fontSize: 16, fontWeight: '800' },
  });
}
