import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabScreenProps } from '../navigation/TabScreenProps';
import { Negocio } from '../types/Negocio';
import { getNegocios } from '../services/api';
import { useFavorites } from '../context/FavoritesContext';
import { RestaurantCard } from '../components/RestaurantCard';
import { EmptyState } from '../components/EmptyState';
import { useColors } from '../context/ThemeContext';
import type { Colors } from '../styles/colors';
import { useUbicacion } from '../hooks/useUbicacion';
import { haversineKm, formatDistancia } from '../services/location';
import { estaAbierto } from '../utils/negocios';
import { LIST_PERF } from '../utils/listPerf';
import { useEstadoNegocios } from '../context/EstadoNegociosContext';

type Props = TabScreenProps<'FavoritosTab'>;

export default function FavoritosScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { ids, toggle, esFavorito } = useFavorites();
  const { conOverride } = useEstadoNegocios();
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { coordenadas, estado, reintentar, abrirAjustes } = useUbicacion();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  useEffect(() => {
    getNegocios().then(setNegocios).finally(() => setLoading(false));
  }, []);

  const favoritos: Negocio[] = useMemo(() => {
    const base: Negocio[] = negocios.filter((n) => ids.includes(n.id)).map(conOverride);
    // Sin GPS: orden del API. Con GPS: distancia real + orden por cercanía.
    let conDistancia = base.map((n) => ({ ...n, distancia: '' }));
    if (coordenadas) {
      conDistancia = base
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
    // Abiertos primero (los cerrados quedan al final, visibles con su badge).
    const abiertos: Negocio[] = conDistancia.filter((n) => estaAbierto(n));
    const cerrados: Negocio[] = conDistancia.filter((n) => !estaAbierto(n));
    return [...abiertos, ...cerrados];
  }, [negocios, ids, conOverride, coordenadas]);

  if (loading) {
    // Area loading
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top + 12 }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      {/* Area titulo */}
      <Text style={styles.title}>Favoritos</Text>
      {estado === 'calculando' && <Text style={styles.subtitle}>Obteniendo ubicación...</Text>}
      {estado === 'sin_permiso' && (
        <View style={styles.gpsRow}>
          <Text style={styles.subtitle}>Permiso de ubicación denegado</Text>
          <TouchableOpacity onPress={() => void abrirAjustes()} hitSlop={8} accessibilityRole="button" accessibilityLabel="Abrir ajustes de ubicación">
            <Text style={styles.gpsAction}>Abrir ajustes</Text>
          </TouchableOpacity>
        </View>
      )}
      {estado === 'no_disponible' && (
        <View style={styles.gpsRow}>
          <Text style={styles.subtitle}>Ubicación no disponible</Text>
          <TouchableOpacity onPress={() => void reintentar()} hitSlop={8} accessibilityRole="button">
            <Text style={styles.gpsAction}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      )}
      {favoritos.length === 0 ? (
        // Area vacio
        <EmptyState
          icono="heart-outline"
          iconoSize={42}
          circuloSize={96}
          titulo="Sin favoritos"
          tituloSize={22}
          subtitulo="Todavía no marcaste favoritos. Toca el corazón en un restaurante para guardarlo aquí."
          style={styles.emptyWrap}
          subtituloStyle={styles.emptySubtitulo}
        />
      ) : (
        // Area lista de restaurante
        <FlatList
          data={favoritos}
          keyExtractor={(item) => item.id}
          {...LIST_PERF}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <RestaurantCard
              negocio={item}
              esFavorito={esFavorito(item.id)}
              onToggleFavorito={() => toggle(item.id)}
              onPress={() => navigation.navigate('Detalle', { negocioId: item.id })}
            />
          )}
        />
      )}
    </View>
  );
}

function makeStyles(c: Colors) {
  return StyleSheet.create({
    // Base
    container: { flex: 1, padding: 16, backgroundColor: c.background },
    center: { justifyContent: 'center', alignItems: 'center' },

    // Area titulo
    title: { color: c.textPrimary, fontSize: 22, fontWeight: '900', marginBottom: 4 },

    // GPS estado
    subtitle: { fontSize: 12, color: c.textSecondary, marginTop: 4 },

    // Area vacio
    emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10, paddingBottom: 60 },
    emptySubtitulo: { paddingHorizontal: 24 },

    // Area lista de restaurante
    list: { gap: 4, paddingVertical: 12, paddingBottom: 110 },
    separator: { height: 12 },
    // GPS row and action styles (reused from HomeScreen pattern)
    gpsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
    gpsAction: { color: c.primary, fontSize: 12, fontWeight: '800' },
  });
}
