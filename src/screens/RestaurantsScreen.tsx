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
import { CategoriaNegocio, Negocio } from '../types/Negocio';
import { RestaurantCard } from '../components/RestaurantCard';
import { ScreenHeader } from '../components/ScreenHeader';
import { LoadingState, ErrorState } from '../components/StateView';
import { EmptyState } from '../components/EmptyState';
import { getNegocios } from '../services/api';
import { estaAbierto } from '../utils/negocios';
import { LIST_PERF } from '../utils/listPerf';
import { useUbicacion } from '../hooks/useUbicacion';
import { haversineKm, formatDistancia } from '../services/location';
import { useFavorites } from '../context/FavoritesContext';
import { useEstadoNegocios } from '../context/EstadoNegociosContext';
import { useOpiniones } from '../context/OpinionesContext';
import { resumenOpiniones } from '../utils/opinionesDemo';
import { RootStackParamList } from '../navigation/RootStackParamList';
import { useColors } from '../context/ThemeContext';
import type { Colors } from '../styles/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Restaurants'>;

const FILTROS: string[] = [
  'Todos', 'Solo abiertos', 'Envío gratis', 'Top 4.5+',
  'Pollerías', 'Chifas', 'Comida criolla', 'Broaster', 'Anticuchos',
  'Cevicherías', 'Caldos', 'Pizza', 'Pastelería', 'Sanguchería', 'Juguería',
  'Cafetería',
];
// Chips de categoría → campos `categorias[]` (o `categoria`) real del negocio (Fase 1).
const FILTROS_CATEGORIA: { chip: string; categoria: CategoriaNegocio }[] = [
  { chip: 'Pollerías', categoria: 'polleria' },
  { chip: 'Chifas', categoria: 'chifa' },
  { chip: 'Comida criolla', categoria: 'comida_criolla' },
  { chip: 'Broaster', categoria: 'broaster' },
  { chip: 'Anticuchos', categoria: 'anticuchos' },
  { chip: 'Cevicherías', categoria: 'cevicheria' },
  { chip: 'Caldos', categoria: 'caldos' },
  { chip: 'Pizza', categoria: 'pizza' },
  { chip: 'Pastelería', categoria: 'pasteleria' },
  { chip: 'Sanguchería', categoria: 'sangucheria' },
  { chip: 'Juguería', categoria: 'jugueria' },
  { chip: 'Cafetería', categoria: 'cafeteria' },
];

// Categorías efectivas del negocio: `categorias[]` si tiene elementos,
// si no la `categoria` única vieja (datos pre-migración siguen sirviendo).
function categoriasDe(n: Negocio): CategoriaNegocio[] {
  if (n.categorias && n.categorias.length > 0) return n.categorias;
  return n.categoria ? [n.categoria] : [];
}

// Filtros: atributos (envío, top) se exigen todos; categorías, basta con una
// (usa `categorias[]` sin adivinar por nombre). `rating` viene del resumen.
function pasaFiltros(n: Negocio, activos: string[], rating: number): boolean {
  if (activos.includes('Solo abiertos') && !estaAbierto(n)) return false;
  if (activos.includes('Envío gratis') && !n.envioGratis) return false;
  if (activos.includes('Top 4.5+') && rating < 4.5) return false;
  const categorias = FILTROS_CATEGORIA.filter((f) => activos.includes(f.chip));
  if (categorias.length === 0) return true;
  const delNegocio: CategoriaNegocio[] = categoriasDe(n);
  return categorias.some((f) => delNegocio.includes(f.categoria));
}

export default function RestaurantsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [query, setQuery] = useState<string>('');
  const [filtrosActivos, setFiltrosActivos] = useState<string[]>([]);
  const { coordenadas, estado, reintentar, abrirAjustes } = useUbicacion();
  const { toggle, esFavorito } = useFavorites();
  const { conOverride } = useEstadoNegocios();
  const { listaDe } = useOpiniones();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

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

  // Cargar negocios una vez al montar (sin depender de userLoc/coordenadas).
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void load();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [load]);

  const filtered: Negocio[] = useMemo(() => {
    const conOverrides: Negocio[] = negocios.map(conOverride);
    const porTexto: Negocio[] = query.trim()
      ? conOverrides.filter((n) => n.nombre.toLowerCase().includes(query.trim().toLowerCase()))
      : conOverrides;
    const porFiltro: Negocio[] = porTexto.filter((n) =>
      pasaFiltros(n, filtrosActivos, resumenOpiniones(listaDe(n.id)).promedio),
    );
    // Sin GPS: orden del API. Con GPS: distancia real + orden por cercanía.
    let conDistancia = porFiltro.map((n) => ({ ...n, distancia: '' }));
    if (coordenadas) {
      conDistancia = porFiltro
        .map((n) => {
          if (
            typeof n.lat !== 'number' ||
            !Number.isFinite(n.lat) ||
            n.lat < -90 ||
            n.lat > 90 ||
            typeof n.lng !== 'number' ||
            !Number.isFinite(n.lng) ||
            n.lng < -180 ||
            n.lng > 180
          ) {
            return { negocio: { ...n, distancia: '' }, km: null };
          }
          const km = haversineKm(coordenadas, { latitude: n.lat, longitude: n.lng });
          if (!Number.isFinite(km)) {
            return { negocio: { ...n, distancia: '' }, km: null };
          }
          return { negocio: { ...n, distancia: formatDistancia(km) }, km };
        })
        .sort((a, b) => {
          if (a.km === null) return b.km === null ? 0 : 1;
          if (b.km === null) return -1;
          return a.km - b.km;
        })
        .map((r) => r.negocio);
    }
    // Abiertos primero; los cerrados quedan visibles al final (no se ocultan).
    const abiertos: Negocio[] = conDistancia.filter((n) => estaAbierto(n));
    const cerrados: Negocio[] = conDistancia.filter((n) => !estaAbierto(n));
    return [...abiertos, ...cerrados];
  }, [negocios, query, filtrosActivos, coordenadas, conOverride, listaDe]);

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
              {f === 'Solo abiertos' ? (
                <Ionicons
                  name="storefront-outline"
                  size={15}
                  color={activo ? colors.white : colors.primary}
                />
              ) : null}
              {f === 'Envío gratis' ? (
                <Ionicons
                  name="bicycle-outline"
                  size={15}
                  color={activo ? colors.white : colors.primary}
                />
              ) : null}
              {f === 'Top 4.5+' ? (
                <Ionicons
                  name="star"
                  size={14}
                  color={activo ? colors.white : colors.primary}
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

      <View style={styles.gpsNote}>
        {estado === 'disponible' && <Text>📍 Ordenado por tu ubicación real</Text>}
        {estado === 'calculando' && <Text>Calculando distancias reales…</Text>}
        {estado === 'sin_permiso' && (
          <>
            <Text>Activa tu ubicación para ver distancias reales</Text>
            <TouchableOpacity onPress={abrirAjustes}>
              <Text style={{ color: colors.primary }}>Configuración</Text>
            </TouchableOpacity>
          </>
        )}
        {estado === 'no_disponible' && (
          <>
            <Text>No pudimos obtener tu ubicación</Text>
            <TouchableOpacity onPress={reintentar}>
              <Text style={{ color: colors.primary }}>Reintentar</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/*Area lista de restaurante*/}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        {...LIST_PERF}
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

function makeStyles(c: Colors) {
  return StyleSheet.create({
    // Base
    container: { flex: 1, paddingHorizontal: 16, backgroundColor: c.background },
    center: { justifyContent: 'center', alignItems: 'center', gap: 12 },
    statusText: { color: c.textMuted, fontSize: 14, textAlign: 'center' },

    // Area titulo
    header: { marginBottom: 12 },

    // Busqueda
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 22,
      backgroundColor: c.surface,
    },
    input: { flex: 1, paddingVertical: 11, fontSize: 15, color: c.textPrimary },

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
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    chipActive: { backgroundColor: c.primary, borderColor: c.primary },
    chipText: { fontSize: 13.5, fontWeight: '700', color: c.textPrimary },
    chipTextActive: { color: c.white },
    clearChip: {
      flexShrink: 0,
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 4,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 999,
      backgroundColor: c.surface,
      borderWidth: 1.5,
      borderColor: c.error,
    },
    clearChipText: { fontSize: 13.5, fontWeight: '800', color: c.error },
    gpsNote: { color: c.textMuted, fontSize: 12, marginBottom: 4 },

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
      borderColor: c.primary,
      backgroundColor: c.surface,
    },
    clearText: { color: c.primary, fontSize: 14, fontWeight: '700' },

    // Area loading / error
    retryButton: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: c.primary,
    },
    retryText: { color: c.white, fontSize: 14, fontWeight: '700' },
  });
}
