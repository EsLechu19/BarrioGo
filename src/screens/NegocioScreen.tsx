import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { TabScreenProps } from '../navigation/TabScreenProps';
import { firebaseReady } from '../services/firebase';
import {
  cambiarEstadoPedido,
  cambiarDisponibilidadProducto,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
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
import { colors } from '../styles/colors';
import { SIGUIENTE_ESTADO } from '../utils/estadosPedido';
import { confirm } from '../utils/confirm';

const GUIA_HABILITACION =
  "Pedí al equipo que en Firestore users/{uid} te ponga rol:'negocio' y negocioId:'1'";

type Props = TabScreenProps<'NegocioTab'>;

export default function NegocioScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user, rol } = useAuth();
  const uid: string | undefined = user?.uid;

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

  // Mi menú: productos reales del negocio (getMenu), incluidos los pausados
  // para que el dueño pueda volver a activarlos.
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loadingMenu, setLoadingMenu] = useState<boolean>(false);
  const [menuError, setMenuError] = useState<string | null>(null);
  const [menuActionId, setMenuActionId] = useState<string | null>(null);
  const [menuActionError, setMenuActionError] = useState<string | null>(null);
  const [menuActionOk, setMenuActionOk] = useState<string | null>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState<string>('');
  const [editPrecio, setEditPrecio] = useState<string>('');

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

  async function cargarMenu(): Promise<void> {
    if (!negocioId) return;
    setLoadingMenu(true);
    setMenuError(null);
    try {
      const data: Producto[] = await getMenu(negocioId, { incluirNoDisponibles: true });
      setProductos(data);
    } catch {
      setMenuError('No se pudo cargar tu menú. Intentá de nuevo.');
    } finally {
      setLoadingMenu(false);
    }
  }

  useEffect(() => {
    if (!negocioId) return;
    void cargarMenu();
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
    if (!(precioNumerico > 0) || !Number.isFinite(precioNumerico)) {
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
      await cargarMenu();
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

  async function togglePausar(productoId: string): Promise<void> {
    if (menuActionId || !negocioId || !uid) return;
    setMenuActionId(productoId);
    setMenuActionError(null);
    setMenuActionOk(null);
    try {
      const disponible: boolean = await cambiarDisponibilidadProducto({
        productoId,
        negocioId,
        usuarioId: uid,
      });
      await cargarMenu();
      setMenuActionOk(disponible ? 'Producto activado.' : 'Producto pausado.');
    } catch (e) {
      setMenuActionError(
        e instanceof Error ? e.message : 'No se pudo cambiar la disponibilidad.',
      );
    } finally {
      setMenuActionId(null);
    }
  }

  function eliminarLocal(productoId: string): void {
    if (menuActionId || !negocioId || !uid) return;
    setMenuActionId(productoId);
    setMenuActionError(null);
    setMenuActionOk(null);
    void (async () => {
      const confirmado: boolean = await confirm({
        title: 'Quitar producto',
        message: 'Esta acción eliminará el producto del menú.',
        confirmText: 'Quitar',
        destructive: true,
      });
      if (!confirmado) {
        setMenuActionId(null);
        return;
      }
      try {
        await eliminarProducto({ productoId, negocioId, usuarioId: uid });
        await cargarMenu();
        if (editandoId === productoId) setEditandoId(null);
        setMenuActionOk('Producto eliminado.');
      } catch (e) {
        setMenuActionError(
          e instanceof Error ? e.message : 'No se pudo eliminar el producto.',
        );
      } finally {
        setMenuActionId(null);
      }
    })();
  }

  function empezarEdicion(producto: Producto): void {
    setEditandoId(producto.id);
    setEditNombre(producto.nombre);
    setEditPrecio(String(producto.precio));
  }

  function guardarEdicion(productoId: string): void {
    const nombreValido: string = editNombre.trim();
    const precioNumerico: number = Number(editPrecio.replace(',', '.'));
    if (!nombreValido) {
      setMenuActionError('El producto necesita un nombre.');
      return;
    }
    if (!(precioNumerico > 0) || !Number.isFinite(precioNumerico)) {
      setMenuActionError('El precio debe ser mayor a 0.');
      return;
    }
    if (menuActionId || !negocioId || !uid) return;
    setMenuActionId(productoId);
    setMenuActionError(null);
    setMenuActionOk(null);
    void (async () => {
      try {
        await actualizarProducto({
          productoId,
          negocioId,
          usuarioId: uid,
          nombre: nombreValido,
          precio: precioNumerico,
        });
        await cargarMenu();
        setEditandoId(null);
        setMenuActionOk('Producto actualizado.');
      } catch (e) {
        setMenuActionError(
          e instanceof Error ? e.message : 'No se pudo actualizar el producto.',
        );
      } finally {
        setMenuActionId(null);
      }
    })();
  }

  const menuVisible: Producto[] = productos;
  const pausados: string[] = productos
    .filter((producto) => producto.disponible === false)
    .map((producto) => producto.id);

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
          menuActionId={menuActionId}
          menuActionError={menuActionError}
          menuActionOk={menuActionOk}
          onRefreshMenu={() => void cargarMenu()}
          editandoId={editandoId}
          editNombre={editNombre}
          editPrecio={editPrecio}
          onEditNombreChange={setEditNombre}
          onEditPrecioChange={setEditPrecio}
          onVerDetalle={() => navigation.navigate('Detalle', { negocioId })}
          onEmpezarEdicion={empezarEdicion}
          onCancelarEdicion={() => setEditandoId(null)}
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

const styles = StyleSheet.create({
  // Base
  container: { flex: 1, gap: 12, padding: 16, backgroundColor: colors.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  subtitle: { color: colors.textMuted, fontSize: 14, textAlign: 'center' },
  error: { color: colors.error, fontSize: 14, fontWeight: '600' },

  // Hero del negocio
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: '900' },
});
