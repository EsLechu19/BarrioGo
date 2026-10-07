import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../navigation/RootStackParamList';
import { TabParamList } from '../navigation/TabParamList';
import { firebaseReady, getFirestoreDb } from '../services/firebase';
import {
  cambiarEstadoPedido,
  crearProducto,
  escucharPedidosNegocio,
} from '../services/api';
import { EstadoPedido, Pedido } from '../types/Pedido';
import { colors } from '../styles/colors';

const ESTADO_COLORS: Record<EstadoPedido, string> = {
  pendiente: '#F59E0B',
  confirmado: '#3B82F6',
  en_camino: '#8B5CF6',
  entregado: '#10B981',
};

const SIGUIENTE_ESTADO: Record<
  Exclude<EstadoPedido, 'entregado'>,
  EstadoPedido
> = {
  pendiente: 'confirmado',
  confirmado: 'en_camino',
  en_camino: 'entregado',
};

const GUIA_HABILITACION =
  "Pedí al equipo que en Firestore users/{uid} te ponga rol:'negocio' y negocioId:'1'";

function fechaCorta(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString();
}

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'NegocioTab'>,
  NativeStackScreenProps<RootStackParamList>
>;

export default function NegocioScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user, rol } = useAuth();
  const uid: string | undefined = user?.uid;

  const [negocioId, setNegocioId] = useState<string | null>(null);
  const [loadingNegocio, setLoadingNegocio] = useState<boolean>(true);
  const [negocioError, setNegocioError] = useState<string | null>(null);

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

  useEffect(() => {
    async function leerNegocioId(): Promise<void> {
      if (!firebaseReady || !uid) {
        setLoadingNegocio(false);
        return;
      }
      setLoadingNegocio(true);
      setNegocioError(null);
      try {
        const snap = await getDoc(doc(getFirestoreDb(), 'users', uid));
        const data: unknown = snap.exists() ? snap.data() : null;
        const id: unknown =
          typeof data === 'object' && data !== null
            ? (data as { negocioId?: unknown }).negocioId
            : undefined;
        setNegocioId(typeof id === 'string' && id.trim() ? id : null);
      } catch (e) {
        setNegocioError(
          e instanceof Error
            ? `No se pudo leer tu negocio: ${e.message}`
            : 'No se pudo leer tu negocio. Intentá de nuevo.',
        );
        setNegocioId(null);
      } finally {
        setLoadingNegocio(false);
      }
    }
    void leerNegocioId();
  }, [uid]);

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
      <View style={[styles.container, styles.center, { paddingTop: insets.top + 12 }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.subtitle}>Leyendo tu negocio...</Text>
      </View>
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
      <Text style={styles.title}>Panel negocio</Text>
      <Text style={styles.subtitle}>Negocio {negocioId} — pedidos en tiempo real</Text>
      <TouchableOpacity
        style={styles.editButton}
        onPress={() => navigation.navigate('MiLocal')}
      >
        <Text style={styles.editText}>Editar mi local</Text>
      </TouchableOpacity>
      {pedidosError ? <Text style={styles.error}>{pedidosError}</Text> : null}

      {loadingPedidos ? (
        <View style={styles.centerRow}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.subtitle}>Cargando pedidos...</Text>
        </View>
      ) : pedidos.length === 0 ? (
        <View style={styles.centerRow}>
          <Text style={styles.subtitle}>
            Todavía no hay pedidos para tu negocio.
          </Text>
        </View>
      ) : (
        <FlatList
          data={pedidos}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }: { item: Pedido }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.meta} numberOfLines={1}>
                  {fechaCorta(item.fecha)} — {item.items.length} items
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
              <Text style={styles.total}>S/{item.total.toFixed(2)}</Text>
              {item.estado !== 'entregado' ? (
                <TouchableOpacity
                  style={[
                    styles.advanceButton,
                    avanzandoId === item.id && styles.disabledButton,
                  ]}
                  disabled={avanzandoId === item.id}
                  onPress={() => void avanzarEstado(item)}
                >
                  <Text style={styles.advanceText}>
                    {avanzandoId === item.id
                      ? 'Actualizando...'
                      : `Avanzar a ${SIGUIENTE_ESTADO[item.estado].replace('_', ' ')}`}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )}
        />
      )}

      <View style={styles.form}>
        <Text style={styles.formTitle}>Alta de producto</Text>
        <TextInput
          style={styles.input}
          placeholder="Nombre"
          value={nombre}
          onChangeText={setNombre}
        />
        <TextInput
          style={styles.input}
          placeholder="Precio (ej. 12.50)"
          value={precio}
          onChangeText={setPrecio}
          keyboardType="decimal-pad"
        />
        <TextInput
          style={styles.input}
          placeholder="Descripción (opcional)"
          value={descripcion}
          onChangeText={setDescripcion}
        />
        {formError ? <Text style={styles.error}>{formError}</Text> : null}
        {formOk ? <Text style={styles.ok}>{formOk}</Text> : null}
        <TouchableOpacity
          style={[styles.primaryButton, guardando && styles.disabledButton]}
          disabled={guardando}
          onPress={() => void guardarProducto()}
        >
          <Text style={styles.primaryText}>
            {guardando ? 'Guardando...' : 'Guardar producto'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: 12, padding: 16, backgroundColor: colors.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  centerRow: { alignItems: 'center', gap: 8, paddingVertical: 12 },
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: '900' },
  subtitle: { color: colors.textMuted, fontSize: 14, textAlign: 'center' },
  editButton: {
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  editText: { color: colors.primary, fontSize: 15, fontWeight: '700' },
  error: { color: colors.error, fontSize: 14, fontWeight: '600' },
  ok: { color: colors.success, fontSize: 14, fontWeight: '600' },
  list: { paddingVertical: 4 },
  separator: { height: 8 },
  card: {
    gap: 6,
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
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  meta: { flex: 1, color: colors.textMuted, fontSize: 13 },
  total: { color: colors.textPrimary, fontSize: 17, fontWeight: '900' },
  advanceButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  advanceText: { color: colors.surface, fontSize: 14, fontWeight: '700' },
  form: {
    gap: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  formTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '800' },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  primaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  primaryText: { color: colors.surface, fontSize: 15, fontWeight: '700' },
  disabledButton: { opacity: 0.6 },
});
