import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootStackParamList';
import { TabParamList } from '../navigation/TabParamList';
import { Negocio } from '../types/Negocio';
import { getNegocios } from '../services/api';
import { useFavorites } from '../context/FavoritesContext';
import { RestaurantCard } from '../components/RestaurantCard';
import { colors } from '../styles/colors';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'FavoritosTab'>,
  NativeStackScreenProps<RootStackParamList>
>;

export default function FavoritosScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { ids } = useFavorites();
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    getNegocios()
      .then(setNegocios)
      .finally(() => setLoading(false));
  }, []);

  const favoritos = negocios.filter((n) => ids.includes(n.id));

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top + 12 }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <Text style={styles.title}>Favoritos</Text>
      {favoritos.length === 0 ? (
        <Text style={styles.subtitle}>
          Todavía no marcaste favoritos. Tocá el corazón en un negocio para guardarlo acá.
        </Text>
      ) : (
        <FlatList
          data={favoritos}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => navigation.navigate('Detalle', { negocioId: item.id })}
            >
              <RestaurantCard negocio={item} />
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colors.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: '900', marginBottom: 4 },
  subtitle: { color: colors.textMuted, fontSize: 14 },
  list: { gap: 4, paddingVertical: 12 },
  separator: { height: 12 },
});
