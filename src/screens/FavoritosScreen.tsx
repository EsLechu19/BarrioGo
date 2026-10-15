import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
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

type Props = TabScreenProps<'FavoritosTab'>;

export default function FavoritosScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { ids, toggle, esFavorito } = useFavorites();
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  useEffect(() => {
    getNegocios()
      .then(setNegocios)
      .finally(() => setLoading(false));
  }, []);

  const favoritos = negocios.filter((n) => ids.includes(n.id));

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

    // Area vacio
    emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10, paddingBottom: 60 },
    emptySubtitulo: { paddingHorizontal: 24 },

    // Area lista de restaurante
    list: { gap: 4, paddingVertical: 12, paddingBottom: 110 },
    separator: { height: 12 },
  });
}
