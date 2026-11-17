import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useCallback, useMemo, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/RootStackParamList';
import { Negocio } from '../types/Negocio';
import { Producto } from '../types/Producto';
import { estaAbierto, proximaAperturaTexto, textoEnvio } from '../utils/negocios';
import { LIST_PERF } from '../utils/listPerf';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { useEstadoNegocios } from '../context/EstadoNegociosContext';
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
import { resumenOpiniones, ResumenOpiniones } from '../utils/opinionesDemo';
import { useOpiniones } from '../context/OpinionesContext';
import {
  DIAS_SEMANA_LARGO,
  SECCIONES_CARTA,
  SeccionCarta,
  agruparPorSeccion,
  esRestaurante,
  precioExtraDe,
  precioMenuDe,
  productosDeHoy,
} from '../utils/cartaDiaria';

type Props = NativeStackScreenProps<RootStackParamList, 'Detalle'>;

export default function DetalleScreen({ navigation, route }: Props) {
  const { negocioId } = route.params;
  const insets = useSafeAreaInsets();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [negocio, setNegocio] = useState<Negocio | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [menu, setMenu] = useState<Producto[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, setLoading] = useState<boolean>(true);
  const [tab, setTab] = useState<Tab>('menu');
  const {
    add,
    setCantidad,
    cantidadDe,
    count,
    total,
  } = useCart();
  const { toggle, esFavorito } = useFavorites();
  const { conOverride } = useEstadoNegocios();
  const { user } = useAuth();
  // Opiniones de Firestore + sesión + ejemplos: viven en el contexto para que
  // Inicio, Restaurantes y Detalle midan el rating con la misma lista.
  const { listaDe, publicar } = useOpiniones();
  const [estrellas, setEstrellas] = useState<number>(0);
  const [texto, setTexto] = useState<string>('');
  // Chip de categoría de menú activo (null = "Todos"). Fase 1: los chips
  // se derivan de `categoriaProducto` de los productos reales del menú.
  const [categoriaMenu, setCategoriaMenu] = useState<string | null>(null);
  // Carta diaria (restaurantes): 1 entrada + 1 comida = menú del día.
  const [entradaSel, setEntradaSel] = useState<Producto | null>(null);
  const [comidaSel, setComidaSel] = useState<Producto | null>(null);
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  // Lista del negocio: primero las opiniones publicadas en la sesión y
  // debajo las de ejemplo (determinísticas por negocio).
  const opiniones: Opinion[] = useMemo(
    () => listaDe(negocioId),
    [listaDe, negocioId],
  );

  // Mismo promedio que muestran las cards: una sola fuente de rating.
  const resumen: ResumenOpiniones = useMemo(
    () => resumenOpiniones(opiniones),
    [opiniones],
  );
  const promedio: number = resumen.promedio;

  const distribucion: { nivel: Estrellas; cantidad: number }[] = useMemo(() => {
    const niveles: Estrellas[] = [5, 4, 3, 2, 1];
    return niveles.map((nivel) => ({
      nivel,
      cantidad: opiniones.filter((o) => o.estrellas === nivel).length,
    }));
  }, [opiniones]);

  // Publica solo con sesión: las reglas de Firestore exigen que el
  // usuarioId de la opinión coincida con auth.uid.
  const puedePublicar: boolean =
    !!user &&
    esEstrellas(estrellas) &&
    texto.trim().length > 0 &&
    texto.trim().length <= MAX_TEXTO_OPINION;

  // Categorías del menú, en orden de aparición, solo las que tienen productos.
  const categoriasMenu: string[] = useMemo(() => {
    const vistas: string[] = [];
    menu.forEach((p) => {
      const cat: string | undefined = p.categoriaProducto;
      if (cat && cat.trim() && !vistas.includes(cat)) vistas.push(cat);
    });
    return vistas;
  }, [menu]);

  const menuFiltrado: Producto[] = useMemo(() => {
    if (!categoriaMenu) return menu;
    return menu.filter((p) => p.categoriaProducto === categoriaMenu);
  }, [menu, categoriaMenu]);

  // Carta diaria: solo los restaurantes (comida_criolla) cambian de menú
  // cada día; el resto de negocios ignora esto y usa los chips de arriba.
  const esCartaDiaria: boolean = useMemo(
    () => (negocio ? esRestaurante(negocio) : false),
    [negocio],
  );
  const diaHoy: number = useMemo(() => new Date().getDay(), []);
  // Platos de hoy agrupados en las secciones fijas (sin categoría → "Menú").
  const gruposCarta: Record<SeccionCarta, Producto[]> = useMemo(() => {
    if (!esCartaDiaria) {
      return { Entradas: [], 'Menú': [], Extras: [] };
    }
    return agruparPorSeccion(productosDeHoy(menu, diaHoy));
  }, [esCartaDiaria, menu, diaHoy]);
  const cartaVacia: boolean = useMemo(
    () =>
      esCartaDiaria &&
      SECCIONES_CARTA.every((sec) => gruposCarta[sec].length === 0),
    [esCartaDiaria, gruposCarta],
  );

  const handlePublicar = useCallback(async () => {
    if (!puedePublicar) return;
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
    try {
      await publicar(nueva);
      setEstrellas(0);
      setTexto('');
    } catch (e: unknown) {
      Alert.alert(
        'No se pudo publicar',
        e instanceof Error ? e.message : 'Intentá de nuevo en unos segundos.',
      );
    }
  }, [puedePublicar, estrellas, texto, negocioId, user, publicar]);
  const agregarProducto = useCallback(async (producto: Producto): Promise<void> => {
    // Negocio cerrado (horario o override del dueño): no se puede pedir.
    if (negocio && !estaAbierto(conOverride(negocio))) {
      const negocioVista: Negocio = conOverride(negocio);
      const apertura: string | null = proximaAperturaTexto(negocioVista);
      Alert.alert(
        'Restaurante cerrado',
        apertura
          ? `${negocio.nombre} está cerrado. ${apertura}.`
          : `${negocio.nombre} está cerrado ahora. Intentá más tarde.`,
      );
      return;
    }
    // Fase 2: el carrito multinegocio acepta productos de varios negocios;
    // la separación en un pedido por negocio se hace al confirmar.
    add(producto);
  }, [add, negocio, conOverride]);

  // Extra de la carta diaria: se cobra al precio extra del negocio (los
  // platos de carta no tienen precio propio en Firestore).
  const agregarExtra = useCallback(
    async (item: Producto): Promise<void> => {
      const precio: number = precioExtraDe(negocio ?? {});
      await agregarProducto({ ...item, precio });
    },
    [agregarProducto, negocio],
  );

  // Combo "Menú del día": producto sintético (1 entrada + 1 comida a precio
  // del negocio). El carrito lo toma igual que cualquier otro producto.
  const agregarCombo = useCallback(async (): Promise<void> => {
    if (!negocio || !entradaSel || !comidaSel) return;
    const combo: Producto = {
      id: `menu-dia-${entradaSel.id}+${comidaSel.id}`,
      negocioId: negocio.id,
      nombre: 'Menú del día',
      descripcion: `Entrada: ${entradaSel.nombre} · Comida: ${comidaSel.nombre}`,
      precio: precioMenuDe(negocio),
    };
    await agregarProducto(combo);
    setEntradaSel(null);
    setComidaSel(null);
}, [negocio, entradaSel, comidaSel, agregarProducto]);


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
  const negocioVista: Negocio = conOverride(negocio);
  const abierto: boolean = estaAbierto(negocioVista);
  const proximaApertura: string | null = abierto ? null : proximaAperturaTexto(negocioVista);

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
            ⭐ {resumen.cantidad > 0 ? resumen.promedio.toFixed(1) : '—'} ({resumen.cantidad} {resumen.cantidad === 1 ? 'review' : 'reviews'}) {' '} • {' '} {negocio.tiempoEstimado} {' '} • {' '} {negocio.distancia}
          </Text>
          {textoEnvio(negocio) ? (
            <View style={styles.envioRow}>
              <Ionicons name="cube-outline" size={14} color={colors.primary} />
              <Text
                style={negocio.envioGratis ? styles.envioGratis : styles.envioCondicional}
              >
                {textoEnvio(negocio)}
              </Text>
            </View>
          ) : null}

        </View>
      </View>

      {/* Aviso si el negocio está cerrado (no se bloquea el menú, solo pedir) */}
      {!abierto ? (
        <View style={styles.cerradoBanner}>
          <Ionicons name="lock-closed-outline" size={16} color={colors.textMuted} />
          <Text style={styles.cerradoBannerText}>
            {proximaApertura
              ? `Cerrado ahora · ${proximaApertura}`
              : 'Cerrado ahora · No se pueden hacer pedidos'}
          </Text>
        </View>
      ) : null}

      <View style={styles.divider} />

      {/* Area tabs */}
      <TabBar tab={tab} onCambiar={setTab} />

      {tab === 'menu' ? (
          esCartaDiaria ? (
            // Carta diaria: secciones fijas de hoy (Entradas → Menú → Extras),
            // sin chips; entradas/menú en modo radio (1 c/u) y extras con
            // Agregar al precio extra del negocio.
            <ScrollView contentContainerStyle={[styles.list, cartaVacia && styles.listEmptyGrow]}>
              <View style={styles.cartaTituloRow}>
                <Text style={styles.cartaTitulo}>
                  Carta de hoy ({DIAS_SEMANA_LARGO[diaHoy].toLowerCase()})
                </Text>
                {/* Precio del menú del día: al borde derecho de la fila */}
                <View style={styles.cartaPrecioBadge}>
                  <Text style={styles.cartaPrecioText}>
                    S/{precioMenuDe(negocio).toFixed(2)}
                  </Text>
                </View>
              </View>
              {cartaVacia ? (
                <Text style={[styles.statusText, styles.emptyMenuText]}>
                  Este restaurante no publica su carta de hoy.
                </Text>
              ) : (
                SECCIONES_CARTA.filter((sec) => gruposCarta[sec].length > 0).map(
                  (sec) => (
                    <View key={sec} style={styles.seccionCarta}>
                      <View style={styles.seccionTituloRow}>
                        <Text style={styles.seccionTitulo}>{sec}</Text>
                        {/* El extra se cobra al precio extra del negocio */}
                        {sec === 'Extras' ? (
                          <View style={styles.cartaPrecioBadge}>
                            <Text style={styles.cartaPrecioText}>
                              S/{precioExtraDe(negocio).toFixed(2)}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      <View style={styles.seccionPlatos}>
                        {gruposCarta[sec].map((item) => {
                          const modoSel: boolean =
                            sec === 'Entradas' || sec === 'Menú';
                          const seleccionado: boolean =
                            modoSel &&
                            ((sec === 'Entradas' && entradaSel?.id === item.id) ||
                              (sec === 'Menú' && comidaSel?.id === item.id));
                          return (
                            <ProductoCard
                              key={item.id}
                              producto={item}
                              cantidad={modoSel ? 0 : cantidadDe(item.id)}
                              modoSeleccion={modoSel}
                              seleccionado={seleccionado}
                              sinPrecio={sec === 'Extras'}
                              onAgregar={() => {
                                if (sec === 'Entradas') {
                                  setEntradaSel(seleccionado ? null : item);
                                } else if (sec === 'Menú') {
                                  setComidaSel(seleccionado ? null : item);
                                } else {
                                  void agregarExtra(item);
                                }
                              }}
                              onDecrement={() => setCantidad(item.id, cantidadDe(item.id) - 1)}
                              onIncrement={() => setCantidad(item.id, cantidadDe(item.id) + 1)}
                            />
                          );
                        })}
                      </View>
                    </View>
                  ),
                )
              )}
            </ScrollView>
          ) : (
          <FlatList
            data={menuFiltrado}
            keyExtractor={(item) => item.id}
            {...LIST_PERF}
            contentContainerStyle={[styles.list, menuFiltrado.length === 0 && styles.listEmptyGrow]}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListHeaderComponent={
              <View style={styles.menuHeader}>
                {/* Area filtros categorias (chips reales del menú) */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.filterScroll}
                  contentContainerStyle={styles.filterCategory}
                >
                  <TouchableOpacity
                    style={[styles.filterItem, !categoriaMenu && styles.filterItemActive]}
                    onPress={() => setCategoriaMenu(null)}
                    accessibilityRole="button"
                    accessibilityLabel="Ver todo el menú"
                  >
                    <Text style={[styles.filterText, !categoriaMenu && styles.filterTextActive]}>
                      Todos
                    </Text>
                  </TouchableOpacity>
                  {categoriasMenu.map((cat) => {
                    const activa: boolean = categoriaMenu === cat;
                    return (
                      <TouchableOpacity
                        key={cat}
                        style={[styles.filterItem, activa && styles.filterItemActive]}
                        onPress={() => setCategoriaMenu(activa ? null : cat)}
                        accessibilityRole="button"
                        accessibilityLabel={`Filtrar por ${cat}`}
                      >
                        <Text style={[styles.filterText, activa && styles.filterTextActive]}>
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <Text style={styles.recomendadosTitle}>Recomendados</Text>
              </View>
            }
            ListEmptyComponent={
              <Text style={[styles.statusText, styles.emptyMenuText]}>
                {menu.length > 0
                  ? 'No hay productos en esta categoría.'
                  : 'Este restaurante aún no publica su menú.'}
              </Text>
            }
            renderItem={({ item }) => {
              const qty = cantidadDe(item.id);
              return (
                <ProductoCard
                  producto={item}
                  cantidad={qty}
                  onAgregar={() => void agregarProducto(item)}
                  onDecrement={() => setCantidad(item.id, qty - 1)}
                  onIncrement={() => setCantidad(item.id, qty + 1)}
                />
              );
            }}
          />
          )
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

      {/* Barra del combo: aparece apenas el cliente elige 1 entrada / 1 comida */}
      {tab === 'menu' && esCartaDiaria && (entradaSel || comidaSel) ? (
        <View
          style={[
            styles.comboBar,
            // Se apila arriba de la barra del carrito si también está visible.
            { bottom: insets.bottom + 16 + (count > 0 ? 60 : 0) },
          ]}
        >
          {entradaSel && comidaSel ? (
            <TouchableOpacity
              style={styles.comboBoton}
              onPress={() => void agregarCombo()}
              accessibilityRole="button"
              accessibilityLabel="Agregar menú del día al carrito"
            >
              <Ionicons name="add-circle-outline" size={18} color={colors.white} />
              <Text style={styles.comboText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                Menú del día: {entradaSel.nombre} + {comidaSel.nombre} — S/{precioMenuDe(negocio).toFixed(2)}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.comboHint} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
              {entradaSel
                ? `Falta elegir la comida — Menú del día S/${precioMenuDe(negocio).toFixed(2)}`
                : `Elegí 1 entrada y 1 comida — Menú del día S/${precioMenuDe(negocio).toFixed(2)}`}
            </Text>
          )}
        </View>
      ) : null}

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
    cerradoBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginHorizontal: 16,
      marginBottom: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    cerradoBannerText: { color: c.textMuted, fontSize: 13, fontWeight: '600' },

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
    filterScroll: { flexGrow: 0, marginHorizontal: -16, paddingHorizontal: 16 },
    filterCategory: {
      gap: 8, paddingVertical: 12, paddingRight: 32, flexDirection: 'row', alignItems: 'center'
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

    // Carta diaria (restaurantes)
    // Carta diaria (restaurantes)
    cartaTituloRow: {
      flexDirection: 'row',
      alignItems: 'center',
      // Título a la izquierda, precio del menú pegado al borde derecho.
      justifyContent: 'space-between',
      paddingVertical: 8,
    },
    cartaTitulo: {
      color: c.textPrimary,
      fontSize: 18,
      fontWeight: '800',
      flexShrink: 1,
    },
    cartaPrecioBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: c.primarySoft,
    },
    cartaPrecioText: { color: c.primary, fontSize: 13, fontWeight: '800' },
    seccionCarta: { gap: 8, marginTop: 8 },
    seccionTituloRow: {
      flexDirection: 'row',
      alignItems: 'center',
      // Sección a la izquierda, precio del extra al borde derecho.
      justifyContent: 'space-between',
    },
    seccionTitulo: {
      color: c.textMuted,
      fontSize: 13,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    seccionPlatos: { gap: 8 },
    comboBar: {
      position: 'absolute',
      left: 16,
      right: 16,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 14,
      backgroundColor: c.primary,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    },
    comboBoton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    comboText: { color: c.white, fontSize: 14, fontWeight: '800', flexShrink: 1 },
    comboHint: { color: c.white, fontSize: 13, fontWeight: '700', textAlign: 'center' },

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
