import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { RootStackParamList } from '../navigation/RootStackParamList';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { crearPedido } from '../services/api';
import { productosMock } from '../data/productosMock';
import { colors } from '../styles/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Carrito'>;

export default function CarritoScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { items, total, setCantidad, remove, clear } = useCart();
  const { user } = useAuth();
  const [enviando, setEnviando] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
      setErrorMsg('El carrito solo admite un negocio por pedido.');
      return;
    }
    if (!negocioId) {
      setErrorMsg('No se pudo determinar el negocio del pedido.');
      return;
    }
    if (!(total > 0)) {
      setErrorMsg('El total del pedido no es válido.');
      return;
    }
    setEnviando(true);
    try {
      await crearPedido({
        usuarioId: user.uid,
        negocioId,
        items,
        total,
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
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>Tu carrito está vacío</Text>
        <Text style={styles.subtitle}>Agregá algo rico desde el menú de un negocio.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('Tabs', { screen: 'InicioTab' })}>
          <Text style={styles.primaryText}>Explorar negocios</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <Text style={styles.title}>Mi carrito</Text>
      <FlatList
        data={detallado}
        keyExtractor={(item) => item.productoId}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.info}>
              <Text style={styles.name}>{item.producto?.nombre ?? item.productoId}</Text>
              <Text style={styles.price}>
                S/{item.precioUnitario.toFixed(2)} c/u — S/
                {(item.precioUnitario * item.cantidad).toFixed(2)}
              </Text>
            </View>
            <View style={styles.qtyRow}>
              <TouchableOpacity
                style={styles.qtyButton}
                onPress={() => setCantidad(item.productoId, item.cantidad - 1)}
              >
                <Text style={styles.qtyText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.qty}>{item.cantidad}</Text>
              <TouchableOpacity
                style={styles.qtyButton}
                onPress={() => setCantidad(item.productoId, item.cantidad + 1)}
              >
                <Text style={styles.qtyText}>+</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => remove(item.productoId)}>
                <Text style={styles.remove}>Quitar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>S/{total.toFixed(2)}</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colors.background },
  center: { justifyContent: 'center', alignItems: 'center', gap: 8 },
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: '900' },
  subtitle: { color: colors.textMuted, fontSize: 14, textAlign: 'center' },
  list: { gap: 4, paddingVertical: 12 },
  separator: { height: 8 },
  row: {
    gap: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  info: { gap: 2 },
  name: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' },
  price: { color: colors.textMuted, fontSize: 13 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  qtyText: { fontSize: 18, fontWeight: '700' },
  qty: { minWidth: 20, textAlign: 'center', fontSize: 15, fontWeight: '700' },
  remove: { color: colors.primary, fontSize: 13, fontWeight: '600' },
  footer: { gap: 10, paddingTop: 8 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 16, fontWeight: '700' },
  totalValue: { fontSize: 20, fontWeight: '900' },
  error: { color: colors.error, fontSize: 14, fontWeight: '600' },
  primaryButton: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  primaryButtonDisabled: { opacity: 0.6 },
  primaryText: { color: colors.surface, fontSize: 15, fontWeight: '700' },
});
