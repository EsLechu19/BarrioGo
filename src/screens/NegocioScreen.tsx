import { useEffect, useMemo, useState, useRef } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { TabScreenProps } from '../navigation/TabScreenProps';
import { firebaseReady } from '../services/firebase';
import {
  cambiarEstadoPedido,
  rechazarPedidoNegocio,
  crearProducto,
  actualizarProducto,
  actualizarDiasProducto,
  escucharPedidosNegocio,
  getMenu,
  getNegocioById,
  subirFotoProducto,
  crearRepartidor,
  escucharRepartidores,
  cambiarEstadoRepartidor,
  eliminarRepartidor,
} from '../services/api';
import { EstadoPedido, Pedido } from '../types/Pedido';
import { Negocio } from '../types/Negocio';
import { Producto } from '../types/Producto';
import { EstadoRepartidor, Repartidor } from '../types/Repartidor';
import { LoadingState } from '../components/StateView';
import { Perfil } from '../components/negocio/Perfil';
import { Seccion, CircleTabBar } from '../components/negocio/CircleTabBar';
import { Pedidos, Stats } from '../components/negocio/Pedidos';
import { Menu } from '../components/negocio/Menu';
import { CartaDelDia } from '../components/negocio/CartaDelDia';
import { Ganancias } from '../components/negocio/Ganancias';
import { Repartidores } from '../components/negocio/Repartidores';
import { Locales } from '../components/negocio/Locales';
import { useNegocioId } from '../hooks/useNegocioId';
import { useColors } from '../context/ThemeContext';
import type { Colors } from '../styles/colors';
import { SIGUIENTE_ESTADO } from '../utils/estadosPedido';
import { esRestaurante, esSeccionCarta, SeccionCarta } from '../utils/cartaDiaria';
import { elegirImagen } from '../utils/imagen';


type Props = TabScreenProps<'NegocioTab'>;

export default function NegocioScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user, rol } = useAuth();
  const uid: string | undefined = user?.uid;
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const {
    negocioId,
    loading: loadingNegocio,
    error: negocioError,
  } = useNegocioId();
  const [negocio, setNegocio] = useState<Negocio | null>(null);
  const esCarta: boolean = negocio ? esRestaurante(negocio) : false;

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [pedidosError, setPedidosError] = useState<string | null>(null);
  const [avanzandoId, setAvanzandoId] = useState<string | null>(null);

  const [repartidores, setRepartidores] = useState<Repartidor[]>([]);
  const loadingRepartidoresInicial = !firebaseReady || rol !== 'negocio' || !negocioId;
  const [loadingRepartidores, setLoadingRepartidores] = useState<boolean>(loadingRepartidoresInicial);
  const [repartidoresError, setRepartidoresError] = useState<string | null>(null);

  const loadingPedidosInicial = !firebaseReady || rol !== 'negocio' || !negocioId;
  const [loadingPedidos, setLoadingPedidos] = useState(loadingPedidosInicial);

  const activoRef = useRef(true);

  const [nombre, setNombre] = useState<string>('');
  const [precio, setPrecio] = useState<string>('');
  const [descripcion, setDescripcion] = useState<string>('');
  const [seccionSel, setSeccionSel] = useState<SeccionCarta>('Menú');
  const [guardando, setGuardando] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formOk, setFormOk] = useState<string | null>(null);
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [fotoError, setFotoError] = useState<string | null>(null);

  // Secciones del panel (botones circulares, Mi menú primero).
  const [seccion, setSeccion] = useState<Seccion>('menu');

  // Mi menú: productos reales del negocio (getMenu). Pausar/eliminar siguen
  // siendo acciones locales; la edición de datos persiste en Firestore.
  // TODO(back): `disponible` en Firestore + deleteDoc real.
  const [productos, setProductos] = useState<Producto[]>([]);
  const loadingMenuInicial = !negocioId;
  const [loadingMenu, setLoadingMenu] = useState(loadingMenuInicial);
  const [menuError, setMenuError] = useState<string | null>(null);
  const [pausados, setPausados] = useState<string[]>([]);
  const [eliminados, setEliminados] = useState<string[]>([]);
  const [guardandoCartaId, setGuardandoCartaId] = useState<string | null>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState<string>('');
  const [editPrecio, setEditPrecio] = useState<string>('');
  const [editDescripcion, setEditDescripcion] = useState<string>('');
  const [editSeccion, setEditSeccion] = useState<SeccionCarta>('Menú');
  // Foto en edición: la URI nueva se distingue de la URL ya persistida.
  const [editFotoUri, setEditFotoUri] = useState<string | null>(null);
  const [editFotoNuevaUri, setEditFotoNuevaUri] = useState<string | null>(null);
  const [editFotoError, setEditFotoError] = useState<string | null>(null);
  const [editGuardando, setEditGuardando] = useState<boolean>(false);

  // Aviso para acciones futuras (invitar repartidor, añadir local).
  const [proximo, setProximo] = useState<string | null>(null);

  useEffect(() => {
    // loadingPedidos ya está inicializado con loadingPedidosInicial
    if (!firebaseReady || rol !== 'negocio' || !negocioId) return;
    const unsubscribe = escucharPedidosNegocio(
      negocioId,
      (data: Pedido[]) => {
        setPedidos(data);
        setLoadingPedidos(false);
      },
      (e: Error) => {
        setPedidosError(e.message);
        setLoadingPedidos(false);
      },
    );
    return unsubscribe;
  }, [rol, negocioId]);

  useEffect(() => {
    if (!firebaseReady || rol !== 'negocio' || !negocioId) return;
    const unsubscribe = escucharRepartidores(
      negocioId,
      (data: Repartidor[]) => {
        setRepartidores(data);
        setLoadingRepartidores(false);
      },
      (e: Error) => {
        setRepartidoresError(e.message);
        setLoadingRepartidores(false);
      },
    );
    return unsubscribe;
  }, [rol, negocioId]);

  // Relee el negocio en cada foco: al volver de "Mi local" el hero del panel
  // muestra las fotos/nuevos datos al instante (antes quedaba viejo).
  useEffect(() => {
    // negocio ya está inicializado en null por defecto
    if (!negocioId) return;
    const cargar = (): void => {
      getNegocioById(negocioId)
        .then((n) => {
          if (activoRef.current) setNegocio(n);
        })
        .catch(() => {
          if (activoRef.current) setNegocio(null);
        });
    };
    cargar();
    const unsubscribe = navigation.addListener('focus', cargar);
    return () => {
      activoRef.current = false;
      unsubscribe();
    };
  }, [negocioId, navigation]);

  useEffect(() => {
    // loadingMenu ya está inicializado con loadingMenuInicial
    if (!negocioId) return;
    getMenu(negocioId)
      .then((data) => {
        if (activoRef.current) setProductos(data);
      })
      .catch(() => {
        if (activoRef.current) setMenuError('No se pudo cargar tu menú. Intentá de nuevo.');
      })
      .finally(() => {
        if (activoRef.current) setLoadingMenu(false);
      });
    return () => {
      activoRef.current = false;
    };
  }, [negocioId]);

  async function avanzarEstado(pedido: Pedido): Promise<void> {
    if (pedido.estado === 'entregado' || pedido.estado === 'cancelado' || avanzandoId) return;
    const siguiente: EstadoPedido = SIGUIENTE_ESTADO[pedido.estado];
    setAvanzandoId(pedido.id);
    setPedidosError(null);
    try {
      await cambiarEstadoPedido(pedido.id, siguiente);
    } catch (e) {
      setPedidosError(
        e instanceof Error
          ? e.message
          : 'No se pudo cambiar el estado. Intentá de nuevo.',
      );
    } finally {
      setAvanzandoId(null);
    }
  }

  async function guardarProducto(): Promise<void> {
    if (guardando || !negocioId) return;
    setFormError(null);
    setFormOk(null);
    setFotoError(null);
    const nombreValido: string = nombre.trim();
    const precioNumerico: number = Number(precio.replace(',', '.'));
    if (!nombreValido) {
      setFormError('El producto necesita un nombre.');
      return;
    }
    if (!esCarta && !(precioNumerico > 0)) {
      setFormError('El precio debe ser mayor a 0.');
      return;
    }
    setGuardando(true);
    try {
      const id: string = await crearProducto({
        negocioId,
        usuarioId: uid ?? '',
        nombre: nombreValido,
        ...(esCarta ? { categoriaProducto: seccionSel } : { precio: precioNumerico }),
        descripcion: descripcion.trim(),
        imagenUrl: fotoUri ? await subirFotoProducto(negocioId, uid ?? '', fotoUri) : '',
      });
      setFormOk(`Producto creado (id ${id.slice(0, 6)}…). Ya figura en Detalle.`);
      setNombre('');
      setPrecio('');
      setDescripcion('');
      setSeccionSel('Menú');
      setFotoUri(null);
      const menuActualizado: Producto[] = await getMenu(negocioId);
      setProductos(menuActualizado);
    } catch (e) {
      setFormError(
        e instanceof Error
          ? e.message
          : 'No se pudo crear el producto. Intentá de nuevo.',
      );
    } finally {
      setGuardando(false);
    }
  }

  // Acciones pendientes de persistencia (memoria local, se pierden al salir).
  // TODO(back): pausar = updateDoc(productos/{id}, {disponible}), eliminar =
  // deleteDoc.
  function togglePausar(productoId: string): void {
    setPausados((prev) =>
      prev.includes(productoId)
        ? prev.filter((id) => id !== productoId)
        : [...prev, productoId],
    );
  }

  function eliminarLocal(productoId: string): void {
    setEliminados((prev) =>
      prev.includes(productoId) ? prev : [...prev, productoId],
    );
    if (editandoId === productoId) setEditandoId(null);
  }

  function empezarEdicion(producto: Producto): void {
    setEditandoId(producto.id);
    setEditNombre(producto.nombre);
    setEditPrecio(String(producto.precio));
    setEditDescripcion(producto.descripcion ?? '');
    setEditSeccion(
      esSeccionCarta(producto.categoriaProducto) ? producto.categoriaProducto : 'Menú',
    );
    setEditFotoUri(producto.imagen?.trim() ? producto.imagen : null);
    setEditFotoNuevaUri(null);
    setEditFotoError(null);
  }

  function cancelarEdicion(): void {
    setEditandoId(null);
    setEditDescripcion('');
    setEditSeccion('Menú');
    setEditFotoUri(null);
    setEditFotoNuevaUri(null);
    setEditFotoError(null);
  }

  // Galería → preview local; la subida ocurre al guardar la edición.
  async function subirFotoEdicion(): Promise<void> {
    setEditFotoError(null);
    const resultado = await elegirImagen(false);
    if (resultado.estado === 'error') {
      setEditFotoError(resultado.mensaje);
      return;
    }
    if (resultado.estado === 'cancelado') return;
    setEditFotoUri(resultado.uri);
    setEditFotoNuevaUri(resultado.uri);
  }

  function confirmarRechazo(pedido: Pedido): void {
    if (pedido.estado !== 'pendiente' || avanzandoId) return;
    Alert.alert(
      'Rechazar pedido',
      'Se cancelará este pedido antes de aceptarlo. Esta acción no se puede deshacer.',
      [
        { text: 'Volver', style: 'cancel' },
        {
          text: 'Rechazar pedido',
          style: 'destructive',
          onPress: () => void rechazarPedido(pedido),
        },
      ],
    );
  }

  async function rechazarPedido(pedido: Pedido): Promise<void> {
    if (pedido.estado !== 'pendiente' || avanzandoId) return;
    setAvanzandoId(pedido.id);
    setPedidosError(null);
    try {
      await rechazarPedidoNegocio(pedido.id);
    } catch (e) {
      setPedidosError(
        e instanceof Error
          ? e.message
          : 'No se pudo rechazar el pedido. Intentá de nuevo.',
      );
    } finally {
      setAvanzandoId(null);
    }
  }

  async function seleccionarFotoNueva(modo: 'galeria' | 'camara'): Promise<void> {
    setFotoError(null);
    const resultado = await elegirImagen(modo === 'camara');
    if (resultado.estado === 'error') {
      setFotoError(resultado.mensaje);
      return;
    }
    if (resultado.estado === 'cancelado') return;
    setFotoUri(resultado.uri);
  }

  async function guardarEdicion(productoId: string): Promise<void> {
    const nombreValido: string = editNombre.trim();
    const precioNumerico: number = Number(editPrecio.replace(',', '.'));
    if (!nombreValido) return;
    if (!esCarta && !(precioNumerico > 0)) return;
    const producto: Producto | undefined = productos.find((p) => p.id === productoId);
    if (!producto || !negocioId || !uid || editGuardando) return;
    setEditGuardando(true);
    setEditFotoError(null);
    try {
      const imagenUrl: string = editFotoNuevaUri
        ? await subirFotoProducto(negocioId, uid, editFotoNuevaUri)
        : producto.imagen ?? '';
      await actualizarProducto({
        productoId,
        negocioId,
        usuarioId: uid,
        nombre: nombreValido,
        ...(esCarta
          ? { categoriaProducto: editSeccion }
          : { precio: precioNumerico }),
        descripcion: editDescripcion.trim(),
        imagenUrl,
      });
      setProductos((prev) =>
        prev.map((p) =>
          p.id === productoId
            ? {
                ...p,
                nombre: nombreValido,
                descripcion: editDescripcion.trim(),
                ...(esCarta
                  ? { categoriaProducto: editSeccion }
                  : { precio: precioNumerico }),
                ...(imagenUrl ? { imagen: imagenUrl } : {}),
              }
            : p,
        ),
      );
      setEditandoId(null);
      setEditDescripcion('');
      setEditSeccion('Menú');
      setEditFotoUri(null);
      setEditFotoNuevaUri(null);
    } catch (e) {
      setEditFotoError(e instanceof Error ? e.message : 'No se pudo guardar el producto.');
    } finally {
      setEditGuardando(false);
    }
  }

  async function crearNuevoRepartidor(nombre: string, telefono: string): Promise<void> {
    if (!negocioId || !uid) {
      throw new Error('Tu sesión no está lista para crear repartidores.');
    }
    await crearRepartidor({ negocioId, usuarioId: uid, nombre, telefono });
  }

  async function cambiarEstadoDeRepartidor(
    repartidor: Repartidor,
    estado: EstadoRepartidor,
  ): Promise<void> {
    if (!negocioId || !uid) {
      throw new Error('Tu sesión no está lista para actualizar repartidores.');
    }
    await cambiarEstadoRepartidor(repartidor.id, negocioId, uid, estado);
  }

  async function eliminarDelEquipo(repartidor: Repartidor): Promise<void> {
    if (!negocioId || !uid) {
      throw new Error('Tu sesión no está lista para eliminar repartidores.');
    }
    await eliminarRepartidor(repartidor.id, negocioId, uid);
  }

  async function toggleDiaCarta(producto: Producto, dia: number): Promise<void> {
    if (!negocioId || !uid) {
      Alert.alert('Carta del día', 'Tu sesión no está lista para guardar la carta.');
      return;
    }
    if (guardandoCartaId) return;
    const actuales: number[] =
      producto.diasSemana && producto.diasSemana.length > 0
        ? producto.diasSemana
        : [0, 1, 2, 3, 4, 5, 6];
    const nuevos: number[] = actuales.includes(dia)
      ? actuales.filter((d) => d !== dia)
      : [...actuales, dia].sort((a, b) => a - b);
    if (nuevos.length === 0) {
      Alert.alert(
        'Carta del día',
        'El plato tiene que salir al menos un día. Para ocultarlo, pausalo en Mi menú.',
      );
      return;
    }
    setGuardandoCartaId(producto.id);
    try {
      await actualizarDiasProducto(producto.id, negocioId, uid, nuevos);
      setProductos((prev) =>
        prev.map((p) => (p.id === producto.id ? { ...p, diasSemana: nuevos } : p)),
      );
    } catch (e) {
      Alert.alert(
        'Carta del día',
        e instanceof Error ? e.message : 'No se pudieron guardar los días.',
      );
    } finally {
      setGuardandoCartaId(null);
    }
  }

  const menuVisible: Producto[] = productos.filter(
    (p) => !eliminados.includes(p.id),
  );

  // Resumen del día (solo visual, derivado de la lista en vivo).
  const stats: Stats = useMemo(() => {
    const pendientes: number = pedidos.filter((p) => p.estado === 'pendiente').length;
    const enCurso: number = pedidos.filter(
      (p) => p.estado === 'confirmado' || p.estado === 'en_camino',
    ).length;
    const entregados: number = pedidos.filter((p) => p.estado === 'entregado').length;
     const ventas: number = pedidos
       .filter((p) => p.estado === 'entregado')
       .reduce((acc, p) => acc + p.total, 0);
    return { pendientes, enCurso, entregados, ventas };
  }, [pedidos]);

  // Ventas entregadas por día de la semana actual (índice 0 = lunes).
  const ventasSemana: number[] = useMemo(() => {
    const dias: number[] = [0, 0, 0, 0, 0, 0, 0];
    const hoy: Date = new Date();
    const indiceHoy: number = (hoy.getDay() + 6) % 7;
    const lunes: Date = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - indiceHoy);
    for (const pedido of pedidos) {
      if (pedido.estado !== 'entregado') continue;
      const fecha: Date = new Date(pedido.fecha);
      if (Number.isNaN(fecha.getTime())) continue;
      const dia: Date = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
      const diff: number = Math.round((dia.getTime() - lunes.getTime()) / 86400000);
      if (diff >= 0 && diff < 7) {
        dias[diff] = (dias[diff] ?? 0) + pedido.total;
      }
    }
    return dias;
  }, [pedidos]);

  if (!firebaseReady) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>Panel negocio</Text>
        <Text style={styles.subtitle}>
          Conectá Firebase (archivo .env) para gestionar tus pedidos.
        </Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>Panel negocio</Text>
        <Text style={styles.subtitle}>Iniciá sesión para gestionar tu negocio.</Text>
      </View>
    );
  }

  if (loadingNegocio) {
    return (
      <LoadingState
        mensaje="Leyendo tu negocio..."
        style={[styles.container, styles.center, { paddingTop: insets.top + 12 }]}
        textoStyle={styles.subtitle}
      />
    );
  }

  if (rol !== 'negocio' || !negocioId) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>Panel negocio</Text>
        {negocioError ? <Text style={styles.error}>{negocioError}</Text> : null}
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      {/* Hero del negocio (nombre + foto reales) */}
      <Perfil
        negocio={negocio}
        negocioId={negocioId}
        onEditar={() => navigation.navigate('MiLocal')}
      />
      {pedidosError ? <Text style={styles.error}>{pedidosError}</Text> : null}

      {/* Menú de secciones: botones circulares del mismo tamaño */}
      <CircleTabBar
        seccion={seccion}
        esRestaurante={esCarta}
        conteoPedidos={stats.pendientes}
        conteoMenu={menuVisible.length}
        onSeleccionar={setSeccion}
      />

      {seccion === 'pedidos' ? (
        <Pedidos
          stats={stats}
          loadingPedidos={loadingPedidos}
          pedidos={pedidos}
          avanzandoId={avanzandoId}
          onAvanzar={(pedido) => void avanzarEstado(pedido)}
          onRechazar={confirmarRechazo}
        />
      ) : seccion === 'menu' ? (
        <Menu
          menuVisible={menuVisible}
          loadingMenu={loadingMenu}
          menuError={menuError}
          pausados={pausados}
          editandoId={editandoId}
          editNombre={editNombre}
          editPrecio={editPrecio}
          editDescripcion={editDescripcion}
          editFoto={editFotoUri}
          editFotoError={editFotoError}
          editGuardando={editGuardando}
          editSeccion={editSeccion}
          onEditNombreChange={setEditNombre}
          onEditPrecioChange={setEditPrecio}
          onEditDescripcionChange={setEditDescripcion}
          onEditSeccionChange={setEditSeccion}
          onSubirFotoEdicion={() => void subirFotoEdicion()}
          onVerDetalle={() => navigation.navigate('Detalle', { negocioId })}
          onEmpezarEdicion={empezarEdicion}
          onCancelarEdicion={cancelarEdicion}
          onGuardarEdicion={guardarEdicion}
          onTogglePausar={togglePausar}
          onEliminar={eliminarLocal}
          esRestaurante={esCarta}
          nombre={nombre}
          precio={precio}
          descripcion={descripcion}
          seccionSel={seccionSel}
          onNombreChange={setNombre}
          onPrecioChange={setPrecio}
          onDescripcionChange={setDescripcion}
          onSeccionChange={setSeccionSel}
          guardando={guardando}
          formError={formError}
          formOk={formOk}
          onGuardarProducto={() => void guardarProducto()}
          fotoUri={fotoUri}
          fotoError={fotoError}
          onElegirFoto={() => void seleccionarFotoNueva('galeria')}
          onTomarFoto={() => void seleccionarFotoNueva('camara')}
        />
      ) : seccion === 'carta' && esCarta ? (
        <CartaDelDia
          menu={menuVisible}
          guardandoId={guardandoCartaId}
          onToggleDia={(producto, dia) => void toggleDiaCarta(producto, dia)}
        />
      ) : seccion === 'ganancias' ? (
        <Ganancias stats={stats} pedidosCount={pedidos.length} ventasSemana={ventasSemana} />
      ) : seccion === 'repartidores' ? (
        <Repartidores
          repartidores={repartidores}
          cargando={loadingRepartidores}
          error={repartidoresError}
          onCrear={crearNuevoRepartidor}
          onCambiarEstado={cambiarEstadoDeRepartidor}
          onEliminar={eliminarDelEquipo}
        />
      ) : (
        <Locales
          negocio={negocio}
          mostrarAviso={proximo === 'locales'}
          onAnadir={() => setProximo('locales')}
        />
      )}
    </View>
  );
}

function makeStyles(c: Colors) {
  return StyleSheet.create({
    // Base
    container: { flex: 1, gap: 12, padding: 16, backgroundColor: c.background },
    center: { justifyContent: 'center', alignItems: 'center' },
    subtitle: { color: c.textMuted, fontSize: 14, textAlign: 'center' },
    error: { color: c.error, fontSize: 14, fontWeight: '600' },

    // Hero del negocio
    title: { color: c.textPrimary, fontSize: 22, fontWeight: '900' },
  });
}
