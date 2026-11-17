import { Ionicons } from '@expo/vector-icons';
import {
  AppState,
  FlatList,
  Linking,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Negocio } from '../types/Negocio';
import { RestaurantCard } from '../components/RestaurantCard';
import { LoadingState, ErrorState } from '../components/StateView';
import { EmptyState } from '../components/EmptyState';
import { getNegociosConOrigen, getUbicacionTrabajo } from '../services/api';
import { estaAbierto } from '../utils/negocios';
import { LIST_PERF } from '../utils/listPerf';
import { useEstadoNegocios } from '../context/EstadoNegociosContext';
import { UserCoords, formatDistancia, getUserCoords, haversineKm, permisoUbicacionOtorgado } from '../services/location';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useUnreadNotifications } from '../hooks/useUnreadNotifications';
import { TabScreenProps } from '../navigation/TabScreenProps';
import { useColors } from '../context/ThemeContext';
import type { Colors } from '../styles/colors';
import { nombreVisible } from '../utils/usuario';
import { UbicacionModal } from '../components/UbicacionModal';
import { storage } from '../services/storage';
import {
  aDireccionPedido,
  cargarDireccionCheckout,
  cargarDirecciones,
  direccionSeleccionadaId,
} from '../utils/direcciones';
import type { DireccionUsuario } from '../types/Direccion';

type Props = TabScreenProps<'InicioTab'>;

export default function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [advertenciaFuente, setAdvertenciaFuente] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [query, setQuery] = useState<string>('');
  const [userLoc, setUserLoc] = useState<UserCoords | null>(null);
  const [sinPermisoUbicacion, setSinPermisoUbicacion] = useState<boolean>(false);
  const { toggle, esFavorito } = useFavorites();
  const { conOverride } = useEstadoNegocios();
  const { user } = useAuth();
  const { count: cartCount } = useCart();
  const unreadNotifications = useUnreadNotifications();
  const [direcciones, setDirecciones] = useState<DireccionUsuario[]>([]);
  const [direccionActual, setDireccionActual] = useState<DireccionUsuario | null>(null);
  const [modalUbicacion, setModalUbicacion] = useState<boolean>(false);
  const nombre: string = nombreVisible(user);
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

// Modal autoabierto bandera (solo se abre una vez por sesión)
  const modalAutoabierto = useRef<boolean>(false);

// Función para refrescar ubicación (usada al volver del modal de ubicación)
  const refrescarUbicacion = useCallback(
    async (autoAbrir: boolean): Promise<void> => {
      if (!user) {
        setDireccionActual(null);
        return;
      }
      const lista = await cargarDirecciones(user.uid);
      const activa = await cargarDireccionCheckout(user.uid);
      setDirecciones(lista);
      const idSeleccionada = direccionSeleccionadaId(lista, activa);
      const elegida = idSeleccionada
        ? (lista.find((d) => d.id === idSeleccionada) ?? null)
        : null;
      setDireccionActual(elegida);
      if (elegida || !autoAbrir) return;
      if (lista.length === 0) {
        const trabajo = await getUbicacionTrabajo(user.uid);
        const detalle: string = trabajo?.direccion.trim() ?? '';
        if (detalle.length >= 5) {
          const nueva: DireccionUsuario = {
            id: `d${Date.now()}`,
            alias: 'Trabajo',
            detalle,
            esPrincipal: true,
          };
          setDirecciones([nueva]);
          setDireccionActual(nueva);
          void storage.saveAddresses(user.uid, [nueva]);
          void storage.saveCheckoutAddress(user.uid, aDireccionPedido(nueva));
          return;
        }
      }
      setModalUbicacion(true);
    },
    [user],
  );

  // Cargar negocios: useCallback con dependencias vacías para evitar
  // re-renders innecesarios. El primer setState ocurre después del fetch
  // para no encadenar renders desde el effect.
  const load = useCallback(async () => {
    try {
      const resultado = await getNegociosConOrigen();
      setError(null);
      setAdvertenciaFuente(resultado.advertencia);
      setNegocios(resultado.negocios);
    } catch {
      setError('No se pudo cargar los restaurantes. Revisa tu conexión e intenta de nuevo.');
      setAdvertenciaFuente(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

// Cargar coordenadas de usuario al montar (crítico para GPS)
  useEffect(() => {
    let activo = true;
    void (async () => {
      const coords = await getUserCoords();
      if (!activo) return;
      setUserLoc(coords);
      const otorgado = await permisoUbicacionOtorgado();
      if (activo) setSinPermisoUbicacion(!otorgado);
    })();
    return () => {
      activo = false;
    };
  }, []);

  // Al volver de los ajustes del sistema, refresca permiso y coordenadas.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (estado) => {
      if (estado !== 'active') return;
      void (async () => {
        const otorgado = await permisoUbicacionOtorgado();
        setSinPermisoUbicacion(!otorgado);
        if (!otorgado) return;
        const coords = await getUserCoords();
        setUserLoc(coords);
      })();
    });
    return () => sub.remove();
  }, []);

// Cargar negocios después de obtener la ubicación GPS
  useEffect(() => {
    let activo = true;
    void (async () => {
      try {
        const resultado = await getNegociosConOrigen();
        if (!activo) return;
        setError(null);
        setAdvertenciaFuente(resultado.advertencia);
        setNegocios(resultado.negocios);
      } catch {
        if (!activo) return;
        setError('No se pudo cargar los restaurantes. Revisa tu conexión e intenta de nuevo.');
        setAdvertenciaFuente(null);
      } finally {
        if (activo) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    })();
    return () => {
      activo = false;
    };
  }, [userLoc]);

  // Listener de focus solo si hay usuario (opcional, no bloquea render)
  useEffect(() => {
    if (!user) return;
    const offFoco = navigation.addListener('focus', () => {
      void refrescarUbicacion(!modalAutoabierto.current);
      modalAutoabierto.current = true;
    });
    return () => offFoco?.();
  }, [user, navigation, refrescarUbicacion, modalAutoabierto]);

  const handleMore = () => {
    setModalUbicacion(true);
  };

  const elegirDireccion = (direccion: DireccionUsuario): void => {
    setDireccionActual(direccion);
    setModalUbicacion(false);
    if (user) void storage.saveCheckoutAddress(user.uid, aDireccionPedido(direccion));
  };

  const guardarDireccionNueva = (nueva: DireccionUsuario): void => {
    const lista: DireccionUsuario[] = [...direcciones, nueva];
    setDirecciones(lista);
    setDireccionActual(nueva);
    setModalUbicacion(false);
    if (user) {
      void storage.saveAddresses(user.uid, lista);
      void storage.saveCheckoutAddress(user.uid, aDireccionPedido(nueva));
    }
  };

  const handleSeeAll = () => {
    navigation.navigate('Restaurants');
  };

  const filtered: Negocio[] = useMemo(() => {
    const conOverrides: Negocio[] = negocios.map(conOverride);
    const base = query.trim()
      ? conOverrides.filter((n) => n.nombre.toLowerCase().includes(query.trim().toLowerCase()))
      : conOverrides;
    let conDistancia: Negocio[] = base;
    if (userLoc) {
      conDistancia = base
        .map((n) => {
          const km = haversineKm(userLoc, { latitude: n.lat, longitude: n.lng });
          return { negocio: { ...n, distancia: formatDistancia(km) }, km };
        })
        .sort((a, b) => a.km - b.km)
        .map((r) => r.negocio);
    }
    const abiertos: Negocio[] = conDistancia.filter((n) => estaAbierto(n));
    const cerrados: Negocio[] = conDistancia.filter((n) => !estaAbierto(n));
    return [...abiertos, ...cerrados];
  }, [negocios, query, userLoc, conOverride]);

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
          <TouchableOpacity style={styles.retryButton} onPress={() => { setLoading(true); void load(); }}>
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
              {/* El texto también abre el modal de ubicación, como la flecha. */}
              <TouchableOpacity
                onPress={handleMore}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={
                  direccionActual
                    ? `Cambiar dirección de entrega, actual: ${direccionActual.detalle}`
                    : 'Añadir ubicación'
                }
                style={styles.locationAddressTouch}
              >
                <Text style={styles.locationAddress} numberOfLines={1}>
                  {direccionActual ? direccionActual.detalle : 'Añadir ubicación'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleMore}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={
                  direccionActual
                    ? `Cambiar dirección de entrega, actual: ${direccionActual.detalle}`
                    : 'Añadir ubicación'
                }
              >
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
            accessibilityLabel={
              unreadNotifications > 0
                ? `Ver notificaciones de pedidos, ${unreadNotifications} sin leer`
                : 'Ver notificaciones de pedidos'
            }
          >
            <Ionicons name="notifications-outline" size={22} color={colors.textSecondary} />
            {unreadNotifications > 0 ? (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>
                  {unreadNotifications > 99 ? '99+' : String(unreadNotifications)}
                </Text>
              </View>
            ) : null}
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
        {...LIST_PERF}
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
            {advertenciaFuente ? (
              <View style={styles.sourceWarning}>
                <Ionicons name="cloud-offline-outline" size={18} color={colors.textMuted} />
                <Text style={styles.sourceWarningText}>{advertenciaFuente}</Text>
              </View>
            ) : null}
            {userLoc ? (
              <Text style={styles.gpsNote}>📍 Ordenado por tu ubicación real</Text>
            ) : (
              <View style={styles.gpsRow}>
                <Text style={styles.gpsNote}>
                  Sin ubicación: activá el GPS para ordenar por cercanía
                </Text>
                {sinPermisoUbicacion ? (
                  <TouchableOpacity
                    onPress={() => void Linking.openSettings()}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Abrir ajustes de ubicación"
                  >
                    <Text style={styles.gpsAction}>Abrir ajustes</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            )}
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
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />
        }
      />

      <UbicacionModal
        visible={modalUbicacion}
        direcciones={direcciones}
        seleccionadaId={direccionActual?.id ?? null}
        onCerrar={() => setModalUbicacion(false)}
        onElegir={elegirDireccion}
        onGuardar={guardarDireccionNueva}
      />
    </View>
  );
}

function makeStyles(c: Colors) {
  return StyleSheet.create({
    // Base
    container: { flex: 1, padding: 16, backgroundColor: c.background },
    center: { justifyContent: 'center', alignItems: 'center', gap: 12 },
    statusText: { color: c.textMuted, fontSize: 14, textAlign: 'center' },

    // Area del top-bar
    topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',marginBottom:10 },
    // Locacion
    // flex/minWidth: la dirección encoge con "…" y nunca empuja los iconos.
    location: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 },
    locationTextBlock: { flexDirection: 'column', flexShrink: 1 },
    locationLabel: { color: c.textMuted, fontSize: 12 },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    // maxWidth: el texto se corta antes (ej. "Av. Petit Thouars 281…"), con "…".
    locationAddress: { color: c.textPrimary, fontSize: 14, fontWeight: 'bold', flexShrink: 1, maxWidth: 165 },
    // Toque sobre el texto: mismo destino que la flecha.
    locationAddressTouch: { flexShrink: 1 },
    // Notificacion + carrito
    topActions: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 0 },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.surface,
      borderColor: c.border,
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
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cartBadgeText: { color: c.white, fontSize: 11, fontWeight: '800' },

    // Area bienvenida y busqueda
    headerBlock: { gap: 12, marginBottom: 4 },
    // Bienvenida
    greeting: { gap: 2 },
    greetingTitle: { color: c.textMuted, fontSize: 15 },
    greetingSubtitle: { color: c.textPrimary, fontSize: 22, fontWeight: '900' },
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
    input: { flex: 1, paddingVertical: 10, color: c.textPrimary },

    // Area seccion header
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    sectionTitle: { color: c.textPrimary, fontSize: 18, fontWeight: '800' },
    seeAll: { color: c.primary, fontSize: 14, fontWeight: '700' },
    gpsNote: { color: c.textMuted, fontSize: 12,paddingBottom:10 },
    gpsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
    gpsAction: { color: c.primary, fontSize: 12, fontWeight: '800' },
    sourceWarning: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: 10,
      borderRadius: 10,
      backgroundColor: c.primarySoft,
    },
    sourceWarningText: { flex: 1, color: c.textMuted, fontSize: 13 },

    // Area lista de restaurante
    listContent: { paddingBottom: 110 },
    emptyList: { paddingVertical: 32 },
    separator: { height: 12 },

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
