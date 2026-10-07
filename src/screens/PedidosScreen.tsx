import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootStackParamList';
import { TabParamList } from '../navigation/TabParamList';
import { useAuth } from '../context/AuthContext';
import { escucharMisPedidos } from '../services/api';
import { firebaseReady } from '../services/firebase';
import { EstadoPedido, Pedido } from '../types/Pedido';
import { colors } from '../styles/colors';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'PedidosTab'>,
  NativeStackScreenProps<RootStackParamList>
>;

const ESTADO_COLORS: Record<EstadoPedido, string> = {
  pendiente: '#F59E0B',
  confirmado: '#3B82F6',
  en_camino: '#8B5CF6',
  entregado: '#10B981',
};

function fechaCorta(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString();
}

export default function PedidosScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const uid: string | undefined = user?.uid;
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!firebaseReady || !uid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const unsubscribe = escucharMisPedidos(
      uid,
      (data: Pedido[]) => {
        setPedidos(data);
        setLoading(false);
      },
      (e: Error) => {
        setError(e.message);
        setLoading(false);
      },
    );
    return unsubscribe;
  }, [uid]);

  if (!firebaseReady) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>Mis pedidos</Text>
        <Text style={styles.subtitle}>
          Conectá Firebase (archivo .env) para ver tus pedidos en tiempo real.
        </Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>Mis pedidos</Text>
        <Text style={styles.subtitle}>Iniciá sesión para ver tus pedidos.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top + 12 }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.subtitle}>Cargando tus pedidos...</Text>
      </View>
    );
  }

  if (pedidos.length === 0 && !error) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>Todavía no tenés pedidos</Text>
        <Text style={styles.subtitle}>
          Hacé tu primer pedido y seguí su estado acá en tiempo real.
        </Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Tabs', { screen: 'InicioTab' })}
        >
          <Text style={styles.primaryText}>Hacer un pedido</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <Text style={styles.title}>Mis pedidos</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={pedidos}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.negocio} numberOfLines={1}>
                {item.negocioId}
              </Text>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: ESTADO_COLORS[item.estado] },
                ]}
              >
                <Text style={styles.badgeText}>
                  {item.estado.replace('_', ' ')}
                </Text>
              </View>
            </View>
            <Text style={styles.meta}>
              {fechaCorta(item.fecha)} — {item.items.length} productos
            </Text>
            <Text style={styles.total}>S/{item.total.toFixed(2)}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: 12, padding: 16, backgroundColor: colors.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: '900' },
  subtitle: { color: colors.textMuted, fontSize: 14, textAlign: 'center' },
  error: { color: colors.error, fontSize: 14, fontWeight: '600' },
  list: { paddingVertical: 4 },
  separator: { height: 8 },
  card: {
    gap: 4,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  negocio: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  meta: { color: colors.textMuted, fontSize: 13 },
  total: { color: colors.textPrimary, fontSize: 17, fontWeight: '900' },
  primaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  primaryText: { color: colors.surface, fontSize: 15, fontWeight: '700' },
});
