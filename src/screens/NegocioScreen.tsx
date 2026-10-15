import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { TabScreenProps } from '../navigation/TabScreenProps';
import { firebaseReady } from '../services/firebase';
import {
  cambiarEstadoPedido,
  crearProducto,
  escucharPedidosNegocio,
  getMenu,
  getNegocioById,
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

  // Secciones del panel (botones circulares, Mi menú primero).
  const [seccion, setSeccion] = useState<Seccion>('menu');

  // Mi menú: productos reales del negocio (getMenu). Pausar/eliminar/editar
  // son SOLO DISEÑO en memoria.
  // TODO(back): `disponible` en Firestore + updateDoc/deleteDoc reales.
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loadingMenu, setLoadingMenu] = useState<boolean>(false);
  const [menuError, setMenuError] = useState<string | null>(null);
  const [pausados, setPausados] = useState<string[]>([]);
  const [eliminados, setEliminados] = useState<string[]>([]);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState<string>('');
  const [editPrecio, setEditPrecio] = useState<string>('');
  // Foto en edición: solo vista previa local (solo diseño, sin subir a nadie).
  const [editFotoUri, setEditFotoUri] = useState<string | null>(null);
  const [editFotoError, setEditFotoError] = useState<string | null>(null);

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

  useEffect(() => {
    if (!negocioId) {
      setNegocio(null);
      return;
    }
    let activo = true;
    getNegocioById(negocioId)
      .then((n) => {
        if (activo) setNegocio(n);
      })
      .catch(() => {
        if (activo) setNegocio(null);
      });
    return () => {
      activo = false;
    };
  }, [negocioId]);

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
    if (pedido.estado === 'entregado' || avanzandoId) return;
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
        nombre: nombreValido,
        precio: precioNumerico,
        descripcion: descripcion.trim(),
      });
      setFormOk(`Producto creado (id ${id.slice(0, 6)}…). Ya figura en Detalle.`);
      setNombre('');
      setPrecio('');
      setDescripcion('');
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

  // Acciones de menú SOLO DISEÑO (memoria local, se pierden al salir).
  // TODO(back): pausar = updateDoc(productos/{id}, {disponible}), eliminar =
  // deleteDoc, editar = updateDoc con validación.
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
    setEditFotoError(null);
  }

  function cancelarEdicion(): void {
    setEditandoId(null);
    setEditFotoUri(null);
    setEditFotoError(null);
  }

  // Galería → preview local. No sube a Cloudinary ni toca Firestore.
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
    } catch {
      setEditFotoError('No se pudo elegir la foto. Intentá de nuevo.');
    }
  }

  function guardarEdicionLocal(productoId: string): void {
    const nombreValido: string = editNombre.trim();
    const precioNumerico: number = Number(editPrecio.replace(',', '.'));
    if (!nombreValido || !(precioNumerico > 0)) return;
    setProductos((prev) =>
      prev.map((p) =>
        p.id === productoId
          ? {
              ...p,
              nombre: nombreValido,
              precio: precioNumerico,
              ...(editFotoUri !== null ? { imagen: editFotoUri } : {}),
            }
          : p,
      ),
    );
    setEditandoId(null);
    setEditFotoUri(null);
    setEditFotoError(null);
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
    const ventas: number = pedidos.reduce((acc, p) => acc + p.total, 0);
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
          onEditNombreChange={setEditNombre}
          onEditPrecioChange={setEditPrecio}
          onSubirFotoEdicion={() => void subirFotoEdicion()}
          onVerDetalle={() => navigation.navigate('Detalle', { negocioId })}
          onEmpezarEdicion={empezarEdicion}
          onCancelarEdicion={cancelarEdicion}
          onGuardarEdicion={guardarEdicionLocal}
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
