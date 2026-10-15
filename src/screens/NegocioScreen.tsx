import { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { TabScreenProps } from '../navigation/TabScreenProps';
import { firebaseReady } from '../services/firebase';
import {
  cambiarEstadoPedido,
  rechazarPedidoNegocio,
  crearProducto,
  actualizarProducto,
  escucharPedidosNegocio,
  getMenu,
  getNegocioById,
  subirFotoProducto,
} from '../services/api';
import { EstadoPedido, Pedido } from '../types/Pedido';
import { Negocio } from '../types/Negocio';
import { Producto } from '../types/Producto';
import { LoadingState } from '../components/StateView';
import { Perfil } from '../components/negocio/Perfil';
import { Seccion, CircleTabBar } from '../components/negocio/CircleTabBar';
import { Pedidos, Stats } from '../components/negocio/Pedidos';
import { Menu } from '../components/negocio/Menu';
import { Ganancias } from '../components/negocio/Ganancias';
import { Repartidores } from '../components/negocio/Repartidores';
import { Locales } from '../components/negocio/Locales';
import { useNegocioId } from '../hooks/useNegocioId';
import { useColors } from '../context/ThemeContext';
import type { Colors } from '../styles/colors';
import { SIGUIENTE_ESTADO } from '../utils/estadosPedido';

const GUIA_HABILITACION =
  "Pedí al equipo que en Firestore users/{uid} te ponga rol:'negocio' y negocioId:'1'";

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

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loadingPedidos, setLoadingPedidos] = useState<boolean>(true);
  const [pedidosError, setPedidosError] = useState<string | null>(null);
  const [avanzandoId, setAvanzandoId] = useState<string | null>(null);

  const [nombre, setNombre] = useState<string>('');
  const [precio, setPrecio] = useState<string>('');
  const [descripcion, setDescripcion] = useState<string>('');
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
  const [loadingMenu, setLoadingMenu] = useState<boolean>(false);
  const [menuError, setMenuError] = useState<string | null>(null);
  const [pausados, setPausados] = useState<string[]>([]);
  const [eliminados, setEliminados] = useState<string[]>([]);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState<string>('');
  const [editPrecio, setEditPrecio] = useState<string>('');
  // Foto en edición: la URI nueva se distingue de la URL ya persistida.
  const [editFotoUri, setEditFotoUri] = useState<string | null>(null);
  const [editFotoNuevaUri, setEditFotoNuevaUri] = useState<string | null>(null);
  const [editFotoError, setEditFotoError] = useState<string | null>(null);
  const [editGuardando, setEditGuardando] = useState<boolean>(false);

  // Aviso para acciones futuras (invitar repartidor, añadir local).
  const [proximo, setProximo] = useState<string | null>(null);

  useEffect(() => {
    if (!firebaseReady || rol !== 'negocio' || !negocioId) {
      setLoadingPedidos(false);
      return;
    }
    setLoadingPedidos(true);
    setPedidosError(null);
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

  // Relee el negocio en cada foco: al volver de "Mi local" el hero del panel
  // muestra las fotos/nuevos datos al instante (antes quedaba viejo).
  useEffect(() => {
    if (!negocioId) {
      setNegocio(null);
      return;
    }
    let activo = true;
    const cargar = (): void => {
      getNegocioById(negocioId)
        .then((n) => {
          if (activo) setNegocio(n);
        })
        .catch(() => {
          if (activo) setNegocio(null);
        });
    };
    cargar();
    const unsubscribe = navigation.addListener('focus', cargar);
    return () => {
      activo = false;
      unsubscribe();
    };
  }, [negocioId, navigation]);

  useEffect(() => {
    if (!negocioId) return;
    let activo = true;
    setLoadingMenu(true);
    setMenuError(null);
    getMenu(negocioId)
      .then((data) => {
        if (activo) setProductos(data);
      })
      .catch(() => {
        if (activo) setMenuError('No se pudo cargar tu menú. Intentá de nuevo.');
      })
      .finally(() => {
        if (activo) setLoadingMenu(false);
      });
    return () => {
      activo = false;
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
    if (!(precioNumerico > 0)) {
      setFormError('El precio debe ser mayor a 0.');
      return;
    }
    setGuardando(true);
    try {
      const id: string = await crearProducto({
        negocioId,
        usuarioId: uid ?? '',
        nombre: nombreValido,
        precio: precioNumerico,
        descripcion: descripcion.trim(),
        imagenUrl: fotoUri ? await subirFotoProducto(negocioId, uid ?? '', fotoUri) : '',
      });
      setFormOk(`Producto creado (id ${id.slice(0, 6)}…). Ya figura en Detalle.`);
      setNombre('');
      setPrecio('');
      setDescripcion('');
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
    setEditFotoUri(producto.imagen?.trim() ? producto.imagen : null);
    setEditFotoNuevaUri(null);
    setEditFotoError(null);
  }

  function cancelarEdicion(): void {
    setEditandoId(null);
    setEditFotoUri(null);
    setEditFotoNuevaUri(null);
    setEditFotoError(null);
  }

  // Galería → preview local; la subida ocurre al guardar la edición.
  async function subirFotoEdicion(): Promise<void> {
    setEditFotoError(null);
    try {
      const aspect: [number, number] = [1, 1];
      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect,
        quality: 0.7,
      });
      // Cancelado → no hace nada, nunca crashea.
      if (resultado.canceled) return;
      const asset = resultado.assets[0];
      if (!asset) return;
      setEditFotoUri(asset.uri);
      setEditFotoNuevaUri(asset.uri);
    } catch {
      setEditFotoError('No se pudo elegir la foto. Intentá de nuevo.');
    }
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
    try {
      if (modo === 'camara') {
        const permiso = await ImagePicker.requestCameraPermissionsAsync();
        if (!permiso.granted) {
          setFotoError('Se necesita permiso para usar la cámara.');
          return;
        }
      }
      const opciones: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      };
      const resultado = modo === 'camara'
        ? await ImagePicker.launchCameraAsync(opciones)
        : await ImagePicker.launchImageLibraryAsync(opciones);
      if (!resultado.canceled && resultado.assets[0]) setFotoUri(resultado.assets[0].uri);
    } catch {
      setFotoError('No se pudo elegir la foto. Intentá de nuevo.');
    }
  }

  async function guardarEdicion(productoId: string): Promise<void> {
    const nombreValido: string = editNombre.trim();
    const precioNumerico: number = Number(editPrecio.replace(',', '.'));
    if (!nombreValido || !(precioNumerico > 0)) return;
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
        precio: precioNumerico,
        imagenUrl,
      });
      setProductos((prev) =>
        prev.map((p) =>
          p.id === productoId ? { ...p, nombre: nombreValido, precio: precioNumerico, ...(imagenUrl ? { imagen: imagenUrl } : {}) } : p,
        ),
      );
      setEditandoId(null);
      setEditFotoUri(null);
      setEditFotoNuevaUri(null);
    } catch (e) {
      setEditFotoError(e instanceof Error ? e.message : 'No se pudo guardar el producto.');
    } finally {
      setEditGuardando(false);
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
        <Text style={styles.subtitle}>
          {GUIA_HABILITACION.replace('{uid}', uid ?? 'tu-uid')}
        </Text>
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
          editFoto={editFotoUri}
          editFotoError={editFotoError}
          editGuardando={editGuardando}
          onEditNombreChange={setEditNombre}
          onEditPrecioChange={setEditPrecio}
          onSubirFotoEdicion={() => void subirFotoEdicion()}
          onVerDetalle={() => navigation.navigate('Detalle', { negocioId })}
          onEmpezarEdicion={empezarEdicion}
          onCancelarEdicion={cancelarEdicion}
          onGuardarEdicion={guardarEdicion}
          onTogglePausar={togglePausar}
          onEliminar={eliminarLocal}
          nombre={nombre}
          precio={precio}
          descripcion={descripcion}
          onNombreChange={setNombre}
          onPrecioChange={setPrecio}
          onDescripcionChange={setDescripcion}
          guardando={guardando}
          formError={formError}
          formOk={formOk}
          onGuardarProducto={() => void guardarProducto()}
          fotoUri={fotoUri}
          fotoError={fotoError}
          onElegirFoto={() => void seleccionarFotoNueva('galeria')}
          onTomarFoto={() => void seleccionarFotoNueva('camara')}
        />
      ) : seccion === 'ganancias' ? (
        <Ganancias stats={stats} pedidosCount={pedidos.length} />
      ) : seccion === 'repartidores' ? (
        <Repartidores
          mostrarAviso={proximo === 'repartidores'}
          onAnadir={() => setProximo('repartidores')}
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
