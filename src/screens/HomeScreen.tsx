import { Ionicons } from '@expo/vector-icons';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Negocio } from '../types/Negocio';
import { RestaurantCard } from '../components/RestaurantCard';
import { LoadingState, ErrorState } from '../components/StateView';
import { EmptyState } from '../components/EmptyState';
import { getNegocios } from '../services/api';
import { UserCoords, formatDistancia, getUserCoords, haversineKm } from '../services/location';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { TabScreenProps } from '../navigation/TabScreenProps';
import { colors } from '../styles/colors';
import { nombreVisible } from '../utils/usuario';

type Props = TabScreenProps<'InicioTab'>;

export default function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [query, setQuery] = useState<string>('');
  const [userLoc, setUserLoc] = useState<UserCoords | null>(null);
  const { toggle, esFavorito } = useFavorites();
  const { user } = useAuth();
  const { count: cartCount } = useCart();
  const nombre: string = nombreVisible(user);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const data = await getNegocios();
      setNegocios(data);
    } catch {
      setError('No se pudo cargar los restaurantes. Revisa tu conexión e intenta de nuevo.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    getUserCoords().then(setUserLoc);
  }, [load]);

  const handleMore = () => {
    console.log('Más direcciones');
  };
  const handleSeeAll = () => {
    navigation.navigate('Restaurants');
  };

  const filtered: Negocio[] = useMemo(() => {
    const base = query.trim()
      ? negocios.filter((n) => n.nombre.toLowerCase().includes(query.trim().toLowerCase()))
      : negocios;
    // Sin GPS: orden del API. Con GPS: distancia real + orden por cercanía.
    if (!userLoc) return base;
    return base
      .map((n) => {
        const km = haversineKm(userLoc, { latitude: n.lat, longitude: n.lng });
        return { negocio: { ...n, distancia: formatDistancia(km) }, km };
      })
      .sort((a, b) => a.km - b.km)
      .map((r) => r.negocio);
  }, [negocios, query, userLoc]);

  // Los 5 más cercanos a tu punto GPS ("Ver todos" abre la vista Restaurants).
  const visibles: Negocio[] = filtered.slice(0, 5);

  if (loading && !refreshing) {
    // Area loading
    return (
      <LoadingState
        mensaje="Cargando restaurantes cercanos..."
        style={[styles.container, styles.center, { paddingTop: insets.top + 12 }]}
        textoStyle={styles.statusText}
      />
    );
  }

  if (error) {
    // Area error
    return (
      <ErrorState
        mensaje={error}
        style={[styles.container, styles.center, { paddingTop: insets.top + 12 }]}
        textoStyle={styles.statusText}
        accion={
          <TouchableOpacity style={styles.retryButton} onPress={() => load()}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        }
      />
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      {/* Area del top-bar*/}
      <View style={styles.topBar}>
        {/* Locacion*/}
        <View style={styles.location}>
          <Ionicons name="location-outline" size={30} color={colors.primary} />
          <View style={styles.locationTextBlock}>
            <Text style={styles.locationLabel}>Direccion de entrega</Text>
            <View style={styles.locationRow}>
              <Text style={styles.locationAddress}>Av. Mi casa</Text>
              <TouchableOpacity onPress={handleMore}>
                <Ionicons name="chevron-down" size={18} color={colors.textSecondary}/>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        {/* Notificacion + carrito lado a lado */}
        <View style={styles.topActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('Notificaciones')}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Ver notificaciones de pedidos"
          >
            <Ionicons name="notifications-outline" size={22} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('Carrito')}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={cartCount > 0 ? `Abrir carrito con ${cartCount} productos` : 'Abrir carrito'}
          >
            <Ionicons name="cart-outline" size={22} color={colors.textSecondary} />
            {cartCount > 0 ? (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount > 99 ? '99+' : String(cartCount)}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>
      </View>

      {/*Area lista de restaurante*/}
      <FlatList
        data={visibles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RestaurantCard
            negocio={item}
            esFavorito={esFavorito(item.id)}
            onToggleFavorito={() => toggle(item.id)}
            onPress={() => navigation.navigate('Detalle', { negocioId: item.id })}
          />
        )}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            {/*Area bienvenida y busqueda*/}
            {/* Bienvenida */}
            <View style={styles.greeting}>
              <Text style={styles.greetingTitle}>¡Hola, {nombre}!👋</Text>
              <Text style={styles.greetingSubtitle}>¿Qué se te antoja hoy?</Text>
            </View>
            {/* Busqueda */}
            <View style={styles.inputWrapper}>
              <Ionicons name="search" size={20} color={colors.textPlaceholder} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Buscar restaurantes o platos"
                placeholderTextColor={colors.textPlaceholder}
                style={styles.input}
              />
            </View>
            {/*Area seccion header */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Restaurantes cercanos</Text>
              <TouchableOpacity onPress={handleSeeAll}>
                <Text style={styles.seeAll}>Ver todos</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.gpsNote}>
              {userLoc
                ? '📍 Ordenado por tu ubicación real'
                : 'Sin ubicación: activá el GPS para ordenar por cercanía'}
            </Text>
          </View>
        }
        ListEmptyComponent={
          // Area vacio
          <EmptyState
            icono="search-outline"
            titulo="Sin resultados"
            subtitulo={`No hay restaurantes para "${query}".`}
            style={styles.emptyList}
          />
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Base
  container: { flex: 1, padding: 16, backgroundColor: colors.background },
  center: { justifyContent: 'center', alignItems: 'center', gap: 12 },
  statusText: { color: colors.textMuted, fontSize: 14, textAlign: 'center' },

  // Area del top-bar
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',marginBottom:10 },
  // Locacion
  location: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  locationTextBlock: { flexDirection: 'column' },
  locationLabel: { color: colors.textMuted, fontSize: 12 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationAddress: { color: colors.textPrimary, fontSize: 14, fontWeight: 'bold' },
  // Notificacion + carrito
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 4,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: { color: colors.white, fontSize: 11, fontWeight: '800' },

  // Area bienvenida y busqueda
  headerBlock: { gap: 12, marginBottom: 4 },
  // Bienvenida
  greeting: { gap: 2 },
  greetingTitle: { color: colors.textMuted, fontSize: 15 },
  greetingSubtitle: { color: colors.textPrimary, fontSize: 22, fontWeight: '900' },
  // Busqueda
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    backgroundColor: colors.surface,
  },
  input: { flex: 1, paddingVertical: 10 },

  // Area seccion header
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '800' },
  seeAll: { color: colors.primary, fontSize: 14, fontWeight: '700' },
  gpsNote: { color: colors.textMuted, fontSize: 12,paddingBottom:10 },

  // Area lista de restaurante
  listContent: { paddingBottom: 110 },
  emptyList: { paddingVertical: 32 },
  separator: { height: 12 },

  // Area loading / error
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  retryText: { color: colors.surface, fontSize: 14, fontWeight: '700' },
});
