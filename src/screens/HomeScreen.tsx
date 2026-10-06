import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Negocio } from '../types/Negocio';
import { RestaurantCard } from '../components/RestaurantCard';
import { getNegocios } from '../services/api';
import { useFavorites } from '../context/FavoritesContext';
import { RootStackParamList } from '../navigation/RootStackParamList';
import { TabParamList } from '../navigation/TabParamList';
import { colors } from '../styles/colors';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'InicioTab'>,
  NativeStackScreenProps<RootStackParamList>
>;

export default function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [query, setQuery] = useState<string>('');
  const { toggle, esFavorito } = useFavorites();

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
      setError('No se pudo cargar los negocios. Revisa tu conexión e intenta de nuevo.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleMore = () => {
    console.log('Más direcciones');
  };
  const handleSeeAll = () => {
    console.log('Ver todos');
  };

  const filtered: Negocio[] = query.trim()
    ? negocios.filter((n) => n.nombre.toLowerCase().includes(query.trim().toLowerCase()))
    : negocios;

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top + 12 }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.statusText}>Cargando negocios cercanos...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.statusText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => load()}>
          <Text style={styles.retryText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      {/* Area del top-bar*/}
      <View style={styles.topBar}>
        <View style={styles.location}>
          <Ionicons name="location-outline" size={30} color={colors.primary} />
          <View style={styles.locationTextBlock}>
            <Text style={styles.locationLabel}>Direccion de entrega</Text>
            <View style={styles.locationRow}>
              <Text style={styles.locationAddress}>Av. Mi casa</Text>
              <TouchableOpacity onPress={handleMore}>
                <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <View>
          <Ionicons name="notifications-outline" size={30} color={colors.textSecondary} />
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Detalle', { negocioId: item.id })}
            >
              <RestaurantCard negocio={item} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.favRow}
              onPress={() => toggle(item.id)}
            >
              <Ionicons
                name={esFavorito(item.id) ? 'heart' : 'heart-outline'}
                size={18}
                color={esFavorito(item.id) ? colors.primary : colors.textPlaceholder}
              />
              <Text style={styles.favText}>
                {esFavorito(item.id) ? 'En favoritos' : 'Guardar en favoritos'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <View style={styles.greeting}>
              <Text style={styles.greetingTitle}>¡Hola, Juan!👋</Text>
              <Text style={styles.greetingSubtitle}>¿Qué se te antoja hoy?</Text>
            </View>
            <View style={styles.inputWrapper}>
              <Ionicons name="search" size={20} color={colors.textPlaceholder} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Buscar negocios o productos"
                placeholderTextColor={colors.textPlaceholder}
                style={styles.input}
              />
            </View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Negocios cercanos</Text>
              <TouchableOpacity onPress={handleSeeAll}>
                <Text style={styles.seeAll}>Ver todos</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.statusText}>No hay negocios para "{query}".</Text>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colors.background },
  center: { justifyContent: 'center', alignItems: 'center', gap: 12 },
  statusText: { color: colors.textMuted, fontSize: 14, textAlign: 'center' },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  retryText: { color: colors.surface, fontSize: 14, fontWeight: '700' },

  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  location: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  locationTextBlock: { flexDirection: 'column' },
  locationLabel: { color: colors.textMuted, fontSize: 12 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationAddress: { color: colors.textPrimary, fontSize: 14, fontWeight: 'bold' },

  listContent: { gap: 12, paddingBottom: 24 },
  favRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 6, paddingLeft: 4 },
  favText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  separator: { height: 12 },
  headerBlock: { gap: 12, marginBottom: 4 },
  greeting: { gap: 2 },
  greetingTitle: { color: colors.textMuted, fontSize: 15 },
  greetingSubtitle: { color: colors.textPrimary, fontSize: 22, fontWeight: '900' },
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

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '800' },
  seeAll: { color: colors.primary, fontSize: 14, fontWeight: '700' },
});
