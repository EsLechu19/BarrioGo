import { Ionicons } from '@expo/vector-icons';
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Negocio } from '../types/Negocio';
import { RestaurantCard } from '../components/RestaurantCard';
import { ScreenHeader } from '../components/ScreenHeader';
import { LoadingState, ErrorState } from '../components/StateView';
import { EmptyState } from '../components/EmptyState';
import { getNegocios } from '../services/api';
import { UserCoords, formatDistancia, getUserCoords, haversineKm } from '../services/location';
import { useFavorites } from '../context/FavoritesContext';
import { RootStackParamList } from '../navigation/RootStackParamList';
import { colors } from '../styles/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Restaurants'>;

const FILTROS: string[] = ['Todos', 'Envío gratis', 'Top 4.5+', 'Pollerías', 'Chifas'];
const FILTROS_CATEGORIA: string[] = ['Pollerías', 'Chifas'];

function esPolleria(n: Negocio): boolean {
  const nombre: string = n.nombre.toLowerCase();
  return (
    nombre.includes('poll') || nombre.includes('brasa') || nombre.includes('broaster') || nombre.includes('corral')
  );
}

function esChifa(n: Negocio): boolean {
  const nombre: string = n.nombre.toLowerCase();
  return (
    nombre.includes('chifa') ||
    nombre.includes('drag') ||
    nombre.includes('mandar') ||
    nombre.includes('chung')
  );
}

// Filtros múltiples: atributos (envío, top) se exigen todos (AND);
// categorías (Pollerías/Chifas) pasan si coincide alguna (OR).
function pasaFiltros(n: Negocio, activos: string[]): boolean {
  if (activos.includes('Envío gratis') && !n.envioGratis) return false;
  if (activos.includes('Top 4.5+') && n.rating < 4.5) return false;
  const categorias: string[] = activos.filter((f) => FILTROS_CATEGORIA.includes(f));
  if (categorias.length === 0) return true;
  return categorias.some((c) => (c === 'Pollerías' ? esPolleria(n) : esChifa(n)));
}

export default function RestaurantsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [query, setQuery] = useState<string>('');
  const [filtrosActivos, setFiltrosActivos] = useState<string[]>([]);
  const [userLoc, setUserLoc] = useState<UserCoords | null>(null);
  const { toggle, esFavorito } = useFavorites();

  function toggleFiltro(f: string): void {
    if (f === 'Todos') {
      setFiltrosActivos([]);
      return;
    }
    setFiltrosActivos((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f],
    );
  }

  function limpiarTodo(): void {
    setQuery('');
    setFiltrosActivos([]);
  }

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

  const filtered: Negocio[] = useMemo(() => {
    const porTexto: Negocio[] = query.trim()
      ? negocios.filter((n) => n.nombre.toLowerCase().includes(query.trim().toLowerCase()))
      : negocios;
    const porFiltro: Negocio[] = porTexto.filter((n) => pasaFiltros(n, filtrosActivos));
    // Sin GPS: orden del API. Con GPS: distancia real + orden por cercanía.
    if (!userLoc) return porFiltro;
    return porFiltro
      .map((n) => {
        const km = haversineKm(userLoc, { latitude: n.lat, longitude: n.lng });
        return { negocio: { ...n, distancia: formatDistancia(km) }, km };
      })
      .sort((a, b) => a.km - b.km)
      .map((r) => r.negocio);
  }, [negocios, query, filtrosActivos, userLoc]);

  if (loading && !refreshing) {
    // Area loading
    return (
      <LoadingState
        mensaje="Cargando negocios..."
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
      {/* Area titulo */}
      <ScreenHeader
        titulo="Todos los restaurantes"
        subtitulo={`${filtered.length} ${filtered.length === 1 ? 'local cerca de ti' : 'locales cerca de ti'}`}
        onBack={() => navigation.goBack()}
        backAccessibilityLabel="Volver"
        tituloSize={20}
        style={styles.header}
      />

      {/* Busqueda */}
      <View style={styles.inputWrapper}>
        <Ionicons name="search" size={20} color={colors.textPlaceholder} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar pollerías, chifas..."
          placeholderTextColor={colors.textPlaceholder}
          style={styles.input}
        />
        {query.trim() ? (
          <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
            <Ionicons name="close-circle" size={20} color={colors.textPlaceholder} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filtros */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterRow}
      >
        {FILTROS.map((f) => {
          const activo: boolean =
            f === 'Todos' ? filtrosActivos.length === 0 : filtrosActivos.includes(f);
          return (
            <TouchableOpacity
              key={f}
              style={[styles.chip, activo && styles.chipActive]}
              onPress={() => toggleFiltro(f)}
              accessibilityRole="button"
              accessibilityLabel={f === 'Todos' ? 'Mostrar todos' : `Filtrar por ${f}`}
            >
              {f === 'Envío gratis' ? (
                <Ionicons
                  name="bicycle-outline"
                  size={15}
                  color={activo ? colors.surface : colors.primary}
                />
              ) : null}
              {f === 'Top 4.5+' ? (
                <Ionicons
                  name="star"
                  size={14}
                  color={activo ? colors.surface : colors.primary}
                />
              ) : null}
              <Text style={[styles.chipText, activo && styles.chipTextActive]}>{f}</Text>
            </TouchableOpacity>
          );
        })}
        {/* Limpiar visible cuando hay filtros o búsqueda */}
        {filtrosActivos.length > 0 || query.trim() ? (
          <TouchableOpacity
            style={styles.clearChip}
            onPress={limpiarTodo}
            accessibilityRole="button"
            accessibilityLabel="Limpiar filtros y búsqueda"
          >
            <Ionicons name="close" size={15} color={colors.error} />
            <Text style={styles.clearChipText}>
              Limpiar{filtrosActivos.length > 0 ? ` (${filtrosActivos.length})` : ''}
            </Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>

      <Text style={styles.gpsNote}>
        {userLoc
          ? '📍 Ordenado por tu ubicación real'
          : 'Sin ubicación: activá el GPS para ordenar por cercanía'}
      </Text>

      {/*Area lista de restaurante*/}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RestaurantCard
            negocio={item}
            esFavorito={esFavorito(item.id)}
            onToggleFavorito={() => toggle(item.id)}
            onPress={() => navigation.navigate('Detalle', { negocioId: item.id })}
          />
        )}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 110 }]}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          // Area vacio
          <EmptyState
            icono="storefront-outline"
            titulo="Sin resultados"
            subtitulo={
              query.trim()
                ? `No hay restaurantes para "${query.trim()}" con este filtro.`
                : 'Ningún restaurante cumple ese filtro por ahora.'
            }
            style={styles.emptyWrap}
            iconoStyle={styles.emptyIcon}
            accion={
              <TouchableOpacity
                style={styles.clearButton}
                onPress={limpiarTodo}
              >
                <Text style={styles.clearText}>Limpiar filtros</Text>
              </TouchableOpacity>
            }
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
  container: { flex: 1, paddingHorizontal: 16, backgroundColor: colors.background },
  center: { justifyContent: 'center', alignItems: 'center', gap: 12 },
  statusText: { color: colors.textMuted, fontSize: 14, textAlign: 'center' },

  // Area titulo
  header: { marginBottom: 12 },

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
  input: { flex: 1, paddingVertical: 11, fontSize: 15, color: colors.textPrimary },

  // Filtros
  filterScroll: { flexGrow: 0, flexShrink: 0, marginHorizontal: -16, paddingHorizontal: 16 },
  filterRow: { alignItems: 'center', gap: 8, paddingVertical: 12, paddingRight: 32 },
  chip: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13.5, fontWeight: '700', color: colors.textPrimary },
  chipTextActive: { color: colors.surface },
  clearChip: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.error,
  },
  clearChipText: { fontSize: 13.5, fontWeight: '800', color: colors.error },
  gpsNote: { color: colors.textMuted, fontSize: 12, marginBottom: 4 },

  // Area lista de restaurante
  listContent: { paddingTop: 8 },
  separator: { height: 12 },

  // Area vacio
  emptyWrap: { paddingVertical: 40, paddingHorizontal: 24 },
  emptyIcon: { marginBottom: 4 },
  clearButton: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  clearText: { color: colors.primary, fontSize: 14, fontWeight: '700' },

  // Area loading / error
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  retryText: { color: colors.surface, fontSize: 14, fontWeight: '700' },
});
