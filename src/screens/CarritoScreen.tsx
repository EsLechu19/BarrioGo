import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { RootStackParamList } from '../navigation/RootStackParamList';
import { useCart } from '../context/CartContext';
import { productosMock } from '../data/productosMock';
import { colors } from '../styles/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Carrito'>;

export default function CarritoScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { items, total, setCantidad, remove, clear } = useCart();

  const detallado = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        producto: productosMock.find((p) => p.id === item.productoId),
      })),
    [items],
  );

  const handleConfirmar = () => {
    console.log('Pedido confirmado', items, total);
    clear();
    navigation.navigate('Tabs', { screen: 'PedidosTab' });
  };

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
        <TouchableOpacity style={styles.primaryButton} onPress={handleConfirmar}>
          <Text style={styles.primaryText}>Confirmar pedido</Text>
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
  primaryButton: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  primaryText: { color: colors.surface, fontSize: 15, fontWeight: '700' },
});
