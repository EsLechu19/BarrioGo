import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/RootStackParamList';
import { Negocio } from '../types/Negocio';
import { Producto } from '../types/Producto';
import { getMenu, getNegocioById } from '../services/api';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import { ProductoCard } from '../components/detalle/ProductoCard';
import { TabBar, Tab } from '../components/detalle/TabBar';
import { InfoTab } from '../components/detalle/InfoTab';
import { ReviewsTab } from '../components/detalle/ReviewsTab';
import {
  Estrellas,
  MAX_TEXTO_OPINION,
  Opinion,
  esEstrellas,
} from '../types/Opinion';
import { useColors } from '../context/ThemeContext';
import type { Colors } from '../styles/colors';
import { nombreVisible } from '../utils/usuario';

type Props = NativeStackScreenProps<RootStackParamList, 'Detalle'>;

const OPINIONES_MOCK: Opinion[] = [
  {
    id: 'op-mock-1',
    negocioId: 'preview',
    usuarioId: 'u1',
    nombre: 'María Torres',
    estrellas: 5,
    texto: 'El pollo llegó jugoso y a tiempo. El punto de siempre, recomendado.',
    fecha: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'op-mock-2',
    negocioId: 'preview',
    usuarioId: 'u2',
    nombre: 'Carlos Quispe',
    estrellas: 4,
    texto: 'Buen sabor y porción generosa. Tardó un poco más de lo estimado.',
    fecha: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'op-mock-3',
    negocioId: 'preview',
    usuarioId: 'u3',
    nombre: 'Lucía Fernández',
    estrellas: 5,
    texto: 'Pedimos para toda la familia y todo llegó caliente. Volveremos a pedir.',
    fecha: new Date(Date.now() - 9 * 86400000).toISOString(),
  },
];

export default function DetalleScreen({ navigation, route }: Props) {
  const { negocioId } = route.params;
  const insets = useSafeAreaInsets();
  const [negocio, setNegocio] = useState<Negocio | null>(null);
  const [menu, setMenu] = useState<Producto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [tab, setTab] = useState<Tab>('menu');
  const { add, setCantidad, cantidadDe, count, total } = useCart();
  const { toggle, esFavorito } = useFavorites();
  const { user } = useAuth();
  const [opiniones, setOpiniones] = useState<Opinion[]>(OPINIONES_MOCK);
  const [estrellas, setEstrellas] = useState<number>(0);
  const [texto, setTexto] = useState<string>('');
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const promedio: number = useMemo(() => {
    if (opiniones.length === 0) return 0;
    const suma: number = opiniones.reduce((acc, o) => acc + o.estrellas, 0);
    return suma / opiniones.length;
  }, [opiniones]);

  const distribucion: { nivel: Estrellas; cantidad: number }[] = useMemo(() => {
    const niveles: Estrellas[] = [5, 4, 3, 2, 1];
    return niveles.map((nivel) => ({
      nivel,
      cantidad: opiniones.filter((o) => o.estrellas === nivel).length,
    }));
  }, [opiniones]);

  const puedePublicar: boolean =
    esEstrellas(estrellas) &&
    texto.trim().length > 0 &&
    texto.trim().length <= MAX_TEXTO_OPINION;

  const handlePublicar = useCallback(() => {
    if (!puedePublicar) return;
    // TODO(back): reemplazar por `crearOpinion()` y limpiar al confirmar.
    const nombre: string = nombreVisible(user);
    const nueva: Opinion = {
      id: `local-${Date.now()}`,
      negocioId,
      usuarioId: user?.uid ?? 'local',
      nombre,
      estrellas: estrellas as Estrellas,
      texto: texto.trim(),
      fecha: new Date().toISOString(),
    };
    setOpiniones((prev) => [nueva, ...prev]);
    setEstrellas(0);
    setTexto('');
  }, [puedePublicar, estrellas, texto, negocioId, user]);

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
    // Area loading
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top + 12 }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.statusText}>Cargando menú...</Text>
      </View>
    );
  }

  if (!negocio) {
    // Area vacio
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.statusText}>No encontramos ese restaurante.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.primaryText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const favorito = esFavorito(negocio.id);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Area foto */}
      {/* Hero full-bleed: la imagen ocupa todo el ancho de su zona */}
      <View style={styles.hero}>
        {negocio.portada?.trim() ? (
          <Image
            source={{ uri: negocio.portada }}
            style={styles.heroImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.heroImage, styles.heroPlaceholder]}>
            <Ionicons name="storefront-outline" size={52} color={colors.textPlaceholder} />
          </View>
        )}
        <View style={[styles.overlay, { top: 12 }]}>
          <TouchableOpacity
            style={styles.circleButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.circleButton}
            onPress={() => toggle(negocio.id)}
          >
            <Ionicons
              name={favorito ? 'heart' : 'heart-outline'}
              size={22}
              color={favorito ? colors.primary : colors.textPrimary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/*Informacion */}
      <View style={styles.content}>
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{negocio.nombre}</Text>
          <Text style={styles.meta}>
            ⭐ {negocio.rating} ({negocio.opiniones} reviews) {' '} • {' '} {negocio.tiempoEstimado} {' '} • {' '} {negocio.distancia}
          </Text>
          {negocio.envioGratis ? (
            <View style={styles.envioRow}>
              <Ionicons name="cube-outline" size={14} color={colors.primary} />
              <Text style={styles.envioGratis}>Envío gratis</Text>
            </View>
          ) : negocio.envioMinimo?.trim() ? (
            <View style={styles.envioRow}>
              <Ionicons name="cube-outline" size={14} color={colors.primary} />
              <Text style={styles.envioCondicional}>{negocio.envioMinimo}</Text>
            </View>
          ) : null}

        </View>
      </View>

      <View style={styles.divider} />

      {/* Area tabs */}
      <TabBar tab={tab} onCambiar={setTab} />

      {tab === 'menu' ? (
          <FlatList
            data={menu}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[styles.list, menu.length === 0 && styles.listEmptyGrow]}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListHeaderComponent={
              <View style={styles.menuHeader}>
                {/* Area filtros categorias */}
                <View style={styles.filterCategory}>
                  <View style={styles.filterItemActive}>
                    <Text style={styles.filterTextActive}>Todos</Text>
                  </View>
                  <View style={styles.filterItem}>
                    <Text style={styles.filterText}>Pollo</Text>
                  </View>
                  <View style={styles.filterItem}>
                    <Text style={styles.filterText}>Combos</Text>
                  </View>
                  <View style={styles.filterItem}>
                    <Text style={styles.filterText}>Bebidas</Text>
                  </View>
                </View>

                <Text style={styles.recomendadosTitle}>Recomendados</Text>
              </View>
            }
            ListEmptyComponent={
              <Text style={[styles.statusText, styles.emptyMenuText]}>Este restaurante aún no publica su menú.</Text>
            }
            renderItem={({ item }) => {
              const qty = cantidadDe(item.id);
              return (
                <ProductoCard
                  producto={item}
                  cantidad={qty}
                  onAgregar={() => add(item)}
                  onDecrement={() => setCantidad(item.id, qty - 1)}
                  onIncrement={() => setCantidad(item.id, qty + 1)}
                />
              );
            }}
          />
      ) : tab === 'info' ? (
        <InfoTab negocio={negocio} />
      ) : (
        <ReviewsTab
          opiniones={opiniones}
          promedio={promedio}
          distribucion={distribucion}
          estrellas={estrellas}
          texto={texto}
          puedePublicar={puedePublicar}
          onEstrellasChange={setEstrellas}
          onTextoChange={setTexto}
          onPublicar={handlePublicar}
        />
      )}

      {count > 0 && (
        // Area carrito
        <TouchableOpacity
          style={[styles.cartBar, { bottom: insets.bottom + 16 }]}
          onPress={() => navigation.navigate('Carrito')}
        >
          <Ionicons name="cart-outline" size={20} color={colors.white} />
          <Text style={styles.cartText}>
            Ver carrito ({count}) — S/{total.toFixed(2)}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function makeStyles(c: Colors) {
  return StyleSheet.create({
    // Base
    container: { flex: 1, backgroundColor: c.background },
    center: { justifyContent: 'center', alignItems: 'center', gap: 12, padding: 16 },
    statusText: { color: c.textMuted, fontSize: 14, textAlign: 'center' },
    divider: { height: 1, backgroundColor: c.border, },

    // Area foto
    hero: {
      width: '100%',
      height: 180,
      backgroundColor: c.border,
    },
    heroImage: { width: '100%', height: '100%' },
    heroPlaceholder: {
      backgroundColor: c.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    overlay: {
      position: 'absolute',
      left: 16,
      right: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    circleButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: c.surface,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 4,
    },

    // Informacion
    content: { paddingHorizontal: 16 },
    headerInfo: { gap: 8, paddingVertical: 16 },
    name: { color: c.textPrimary, fontSize: 20, fontWeight: '900' },
    meta: { color: c.textMuted, fontSize: 13 },
    envioRow: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: c.primarySoft, padding: 8, borderRadius: 8, alignSelf: 'flex-start' },
    envioGratis: { color: c.primary, fontSize: 13, fontWeight: '800' },
    envioCondicional: { color: c.primary, fontSize: 13 },

    //filtros categorias
    menuHeader: { gap: 4 },
    filterCategory: {
      gap: 8, padding: 12, flexDirection: 'row', alignItems: 'center', marginHorizontal: 5
    },
    filterItemActive: {
      paddingHorizontal: 16, paddingVertical: 8, backgroundColor: c.primary, borderRadius: 20
    },
    filterItem: {
      paddingHorizontal: 16, paddingVertical: 8, backgroundColor: c.surface, borderRadius: 20, borderWidth: 1, borderColor: c.border
    },
    filterTextActive: {
      fontWeight: 'bold', color: c.white
    },
    filterText: {
      fontWeight: 'bold', color: c.textPrimary
    },

    // Area menu
    sectionTitle: { color: c.textPrimary, fontSize: 18, fontWeight: '800', marginTop: 8 },
    recomendadosTitle: {
      color: c.textPrimary,
      fontSize: 18,
      fontWeight: 'bold',
      paddingHorizontal: 16,
      paddingBottom: 10,
    },
    list: { gap: 4, paddingVertical: 12, paddingHorizontal: 16, paddingBottom: 130 },
    listEmptyGrow: { flexGrow: 1 },
    emptyMenuText: { paddingTop: 24 },
    separator: { height: 8 },

    // Area carrito
    cartBar: {
      position: 'absolute',
      flexDirection: 'row',
      alignItems: 'center',      // centra icono-texto en vertical
      justifyContent: 'center',
      left: 16,
      right: 16,
      bottom: 20,
      gap: 8,
      paddingVertical: 14,
      borderRadius: 14,
      backgroundColor: c.primary,
    },
    cartText: { color: c.white, fontSize: 15, fontWeight: '700' },

    // Area vacio
    primaryButton: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, backgroundColor: c.primary },
    primaryText: { color: c.white, fontSize: 14, fontWeight: '700' },
  });
}
