import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useRef, useState } from 'react';
import { RootStackParamList } from '../navigation/RootStackParamList';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { crearPedido } from '../services/api';
import { confirm } from '../utils/confirm';
import { productosMock } from '../data/productosMock';
import { negociosMock } from '../data/negociosMock';
import { ScreenHeader } from '../components/ScreenHeader';
import { CantidadStepper } from '../components/CantidadStepper';
import { useColors } from '../context/ThemeContext';
import type { Colors } from '../styles/colors';

// Tarifa demo cuando el negocio no ofrece envío gratis (Fase 3: real por
// negocio/zona). Se suma al total del pedido.
const TARIFA_ENVIO: number = 5.0;

type Props = NativeStackScreenProps<RootStackParamList, 'Carrito'>;

export default function CarritoScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { items, total, setCantidad, remove, clear } = useCart();
  const { user } = useAuth();
  const [enviando, setEnviando] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
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
          // replace (no navigate): cambia el Carrito por Restaurants en la
          // pila en vez de apilarlo, para no volver al Carrito al retroceder.
          navigation.replace('Restaurants');
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

  const detallado = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        producto: productosMock.find((p) => p.id === item.productoId),
      })),
    [items],
  );

  // El carrito no guarda negocioId: se infiere del catálogo. Si hay mezcla
  // de negocios, no se puede crear un único pedido.
  const negocioIds: string[] = useMemo(() => {
    const ids = new Set<string>();
    for (const item of items) {
      const prod = productosMock.find((p) => p.id === item.productoId);
      if (prod) ids.add(prod.negocioId);
    }
    return Array.from(ids);
  }, [items]);

  const carritoMezclado: boolean = negocioIds.length > 1;
  const negocioId: string | null =
    negocioIds.length === 1 && negocioIds[0] !== undefined
      ? negocioIds[0]
      : null;

  // Subtotal = suma de productos. Envío según el negocio (gratis o tarifa
  // demo). Total final = lo que se cobra y se guarda en el pedido.
  const subtotal: number = total;
  const negocio = negocioId
    ? negociosMock.find((n) => n.id === negocioId) ?? null
    : null;
  const costoEnvio: number | null =
    negocio === null ? null : negocio.envioGratis ? 0 : TARIFA_ENVIO;
  const totalFinal: number =
    costoEnvio === null ? subtotal : subtotal + costoEnvio;

  const handleConfirmar = async (): Promise<void> => {
    setErrorMsg(null);
    if (!user) {
      setErrorMsg('Iniciá sesión para confirmar tu pedido.');
      return;
    }
    if (items.length === 0) {
      setErrorMsg('El carrito está vacío.');
      return;
    }
    if (carritoMezclado) {
      setErrorMsg('El carrito solo admite un restaurante por pedido.');
      return;
    }
    if (!negocioId) {
      setErrorMsg('No se pudo determinar el restaurante del pedido.');
      return;
    }
    if (!(totalFinal > 0)) {
      setErrorMsg('El total del pedido no es válido.');
      return;
    }
    setEnviando(true);
    try {
      await crearPedido({
        usuarioId: user.uid,
        negocioId,
        items,
        total: totalFinal,
      });
      clear();
      navigation.navigate('Tabs', { screen: 'PedidosTab' });
    } catch (e) {
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
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          // Card producto
          <View style={styles.row}>
            {/* Foto a la izquierda */}
            {item.producto?.imagen?.trim() ? (
              <Image
                source={{ uri: item.producto.imagen }}
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
                {item.nombre?.trim()
                  ? item.nombre
                  : item.producto?.nombre?.trim()
                    ? item.producto.nombre
                    : 'Producto'}
              </Text>
              {item.producto?.descripcion?.trim() ? (
                <Text style={styles.desc} numberOfLines={2}>
                  {item.producto.descripcion}
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
                  accessibilityLabel={`Eliminar ${item.nombre ?? item.producto?.nombre ?? 'producto'} del carrito`}
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
      {/* Area total */}
      <View style={styles.footer}>
        {/* Fila subtotal */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.subValue}>S/{subtotal.toFixed(2)}</Text>
        </View>
        {/* Fila envio */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Envío</Text>
          {costoEnvio === null ? (
            <Text style={styles.subValue}>—</Text>
          ) : costoEnvio === 0 ? (
            <Text style={styles.freeValue}>Gratis</Text>
          ) : (
            <Text style={styles.freeValue}>S/{costoEnvio.toFixed(2)}</Text>
          )}
        </View>
        <View style={styles.divider} />
        {/* Fila total */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>S/{totalFinal.toFixed(2)}</Text>
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
    // Fila total
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    totalLabel: { fontSize: 15, fontWeight: '600', color: c.textSecondary },
    subValue: { fontSize: 15, fontWeight: '700', color: c.textPrimary },
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
