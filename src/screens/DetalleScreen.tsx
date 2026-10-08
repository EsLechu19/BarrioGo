import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/RootStackParamList';
import { Negocio } from '../types/Negocio';
import { Producto } from '../types/Producto';
import { getMenu, getNegocioById } from '../services/api';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { colors } from '../styles/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Detalle'>;

export default function DetalleScreen({ navigation, route }: Props) {
  const { negocioId } = route.params;
  const insets = useSafeAreaInsets();
  const [negocio, setNegocio] = useState<Negocio | null>(null);
  const [menu, setMenu] = useState<Producto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { add, setCantidad, cantidadDe, count, total } = useCart();
  const { toggle, esFavorito } = useFavorites();

  const load = useCallback(async () => {
    setLoading(true);
    const [n, m] = await Promise.all([getNegocioById(negocioId), getMenu(negocioId)]);
    setNegocio(n);
    setMenu(m);
    setLoading(false);
  }, [negocioId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top + 12 }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.statusText}>Cargando menú...</Text>
      </View>
    );
  }

  if (!negocio) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.statusText}>No encontramos ese negocio.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.primaryText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const favorito = esFavorito(negocio.id);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{negocio.nombre}</Text>
          <Text style={styles.meta}>
            ⭐ {negocio.rating} ({negocio.opiniones}) • {negocio.tiempoEstimado} •{' '}
            {negocio.distancia}
          </Text>
        </View>
        <TouchableOpacity onPress={() => toggle(negocio.id)}>
          <Ionicons
            name={favorito ? 'heart' : 'heart-outline'}
            size={26}
            color={favorito ? colors.primary : colors.textPlaceholder}
          />
        </TouchableOpacity>
      </View>

      {/* Portada 16:9 solo si el dueño subió una (S3 apf6-negocio-propio). */}
      {negocio.portada ? (
        <Image
          source={{ uri: negocio.portada }}
          style={styles.portada}
          resizeMode="cover"
        />
      ) : null}

      <Text style={styles.sectionTitle}>Menú</Text>
      <FlatList
        data={menu}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <Text style={styles.statusText}>Este negocio aún no publica su menú.</Text>
        }
        renderItem={({ item }) => {
          const qty = cantidadDe(item.id);
          return (
            <View style={styles.card}>
              <View style={styles.cardInfo}>
                <Text style={styles.dish}>{item.nombre}</Text>
                <Text style={styles.desc}>{item.descripcion}</Text>
                <Text style={styles.price}>S/{item.precio.toFixed(2)}</Text>
              </View>
              {qty === 0 ? (
                <TouchableOpacity style={styles.addButton} onPress={() => add(item)}>
                  <Text style={styles.addText}>Agregar</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.qtyRow}>
                  <TouchableOpacity
                    style={styles.qtyButton}
                    onPress={() => setCantidad(item.id, qty - 1)}
                  >
                    <Text style={styles.qtyText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.qty}>{qty}</Text>
                  <TouchableOpacity
                    style={styles.qtyButton}
                    onPress={() => setCantidad(item.id, qty + 1)}
                  >
                    <Text style={styles.qtyText}>+</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        }}
      />

      {count > 0 && (
        <TouchableOpacity
          style={styles.cartBar}
          onPress={() => navigation.navigate('Carrito')}
        >
          <Text style={styles.cartText}>
            Ver carrito ({count}) — S/{total.toFixed(2)}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colors.background },
  center: { justifyContent: 'center', alignItems: 'center', gap: 12 },
  statusText: { color: colors.textMuted, fontSize: 14, textAlign: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerInfo: { flex: 1, gap: 2 },
  name: { color: colors.textPrimary, fontSize: 20, fontWeight: '900' },
  meta: { color: colors.textMuted, fontSize: 13 },
  portada: { width: '100%', height: 180, borderRadius: 16, marginTop: 12 },
  sectionTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '800', marginTop: 12 },
  list: { gap: 4, paddingVertical: 12, paddingBottom: 90 },
  separator: { height: 8 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  cardInfo: { flex: 1, gap: 2 },
  dish: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' },
  desc: { color: colors.textMuted, fontSize: 13 },
  price: { color: colors.textPrimary, fontSize: 14, fontWeight: '700' },
  addButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: colors.primary },
  addText: { color: colors.surface, fontSize: 14, fontWeight: '700' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
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
  qty: { minWidth: 18, textAlign: 'center', fontSize: 15, fontWeight: '700' },
  cartBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 20,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  cartText: { color: colors.surface, fontSize: 15, fontWeight: '700' },
  primaryButton: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, backgroundColor: colors.primary },
  primaryText: { color: colors.surface, fontSize: 14, fontWeight: '700' },
});
