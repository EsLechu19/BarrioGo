import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootStackParamList';
import { ScreenHeader } from '../components/ScreenHeader';
import { SelectableCard } from '../components/SelectableCard';
import { FormField } from '../components/FormField';
import { EmptyState } from '../components/EmptyState';
import { useColors } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { storage } from '../services/storage';
import { confirm } from '../utils/confirm';
import {
  aDireccionPedido,
  cargarDireccionCheckout,
  cargarDirecciones,
  direccionSeleccionadaId,
} from '../utils/direcciones';
import type { DireccionUsuario } from '../types/Direccion';
import type { Colors } from '../styles/colors';
import { MapaSelector, type CoordenadasMapa } from '../components/MapaSelector';

type Props = NativeStackScreenProps<RootStackParamList, 'Direcciones'>;

export default function DireccionesScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [direcciones, setDirecciones] = useState<DireccionUsuario[]>([]);
  const [seleccionada, setSeleccionada] = useState<string>('');
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [alias, setAlias] = useState<string>('');
  const [detalle, setDetalle] = useState<string>('');
  const [aliasError, setAliasError] = useState<string | undefined>(undefined);
  const [detalleError, setDetalleError] = useState<string | undefined>(undefined);
  const [mapaVisible, setMapaVisible] = useState<boolean>(false);
  const [coordenadas, setCoordenadas] = useState<CoordenadasMapa | null>(null);
  const { user } = useAuth();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  useEffect(() => {
    const usuarioId: string | undefined = user?.uid;
    if (!usuarioId) return;
    let activa = true;
    void Promise.all([
      cargarDirecciones(usuarioId),
      cargarDireccionCheckout(usuarioId),
    ]).then(([lista, direccion]) => {
      if (!activa) return;
      setDirecciones(lista);
      // Selección honesta: nada activo si no hay dirección guardada.
      setSeleccionada(direccionSeleccionadaId(lista, direccion) ?? '');
    });
    return () => {
      activa = false;
    };
  }, [user?.uid]);

  const elegirDireccion = (d: DireccionUsuario): Promise<void> => {
    if (d.id === seleccionada) return Promise.resolve();
    return confirm({
      title: '¿Cambiar dirección de entrega?',
      message: `Tu pedido se enviará a "${d.alias}" (${d.detalle}).`,
      confirmText: 'Cambiar',
    }).then((acepta) => {
      if (!acepta) return;
      setSeleccionada(d.id);
      if (user) {
        void storage.saveCheckoutAddress(user.uid, aDireccionPedido(d));
      }
    });
  };

  const abrirModal = (): void => {
    setAlias('');
    setDetalle('');
    setAliasError(undefined);
    setDetalleError(undefined);
    setEditandoId(null);
    setCoordenadas(null);
    setModalVisible(true);
  };

  const abrirEdicion = (d: DireccionUsuario): void => {
    setAlias(d.alias);
    setDetalle(d.detalle);
    setAliasError(undefined);
    setDetalleError(undefined);
    setEditandoId(d.id);
    setCoordenadas(
      Number.isFinite(d.lat) && Number.isFinite(d.lng)
        ? { lat: d.lat as number, lng: d.lng as number }
        : null,
    );
    setModalVisible(true);
  };

  const cerrarModal = (): void => {
    setModalVisible(false);
    setEditandoId(null);
  };

  const eliminarDireccion = async (d: DireccionUsuario): Promise<void> => {
    const acepta: boolean = await confirm({
      title: '¿Eliminar dirección?',
      message: `Se eliminará "${d.alias}" (${d.detalle}).`,
      confirmText: 'Eliminar',
      destructive: true,
    });
    if (!acepta || !user) return;
    const restantes: DireccionUsuario[] = direcciones.filter((x) => x.id !== d.id);
    // Si se borró la principal, la primera restante queda como principal.
    const conPrincipal: DireccionUsuario[] =
      d.esPrincipal && restantes.length > 0
        ? restantes.map((x, i) => ({ ...x, esPrincipal: i === 0 }))
        : restantes;
    setDirecciones(conPrincipal);
    await storage.saveAddresses(user.uid, conPrincipal);
    if (seleccionada === d.id) {
      setSeleccionada('');
      await storage.clearCheckoutAddress(user.uid);
    }
  };

  const guardarDireccion = (): void => {
    const aliasLimpio: string = alias.trim();
    const detalleLimpio: string = detalle.trim();
    let errorAlias: string | undefined;
    if (aliasLimpio.length < 2) {
      errorAlias = 'Poné un alias de al menos 2 caracteres (ej. Casa).';
    } else if (aliasLimpio.length > 30) {
      errorAlias = 'El alias puede tener hasta 30 caracteres.';
    }
    let errorDetalle: string | undefined;
    if (detalleLimpio.length < 5) {
      errorDetalle = 'Escribí la dirección completa (mínimo 5 caracteres).';
    }
    setAliasError(errorAlias);
    setDetalleError(errorDetalle);
    if (errorAlias || errorDetalle) return;
    const nuevaId: string = `d${Date.now()}`;
    let lista: DireccionUsuario[];
    if (editandoId !== null) {
      lista = direcciones.map((d) =>
        d.id === editandoId
          ? { ...d, alias: aliasLimpio, detalle: detalleLimpio, ...(coordenadas ? coordenadas : {}) }
          : d,
      );
    } else {
      lista = [
        ...direcciones,
        {
          id: nuevaId,
          alias: aliasLimpio,
          detalle: detalleLimpio,
          esPrincipal: direcciones.length === 0,
          ...(coordenadas ? coordenadas : {}),
        },
      ];
    }
    setDirecciones(lista);
    if (user) {
      void storage.saveAddresses(user.uid, lista);
      // Dirección nueva → queda activa. Al editar solo se cambia el checkout
      // si era la que estaba activa (no se roba otra selección).
      const esNueva: boolean = editandoId === null;
      const estabaActiva: boolean = !esNueva && seleccionada === editandoId;
      if (esNueva || estabaActiva) {
        setSeleccionada(editandoId ?? nuevaId);
        const guardada = lista.find((d) => d.id === (editandoId ?? nuevaId));
        if (guardada) void storage.saveCheckoutAddress(user.uid, aDireccionPedido(guardada));
      }
    }
    setModalVisible(false);
    setEditandoId(null);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12 }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          titulo="Direcciones"
          onBack={() => navigation.goBack()}
          backAccessibilityLabel="Volver al perfil"
          right={
            <TouchableOpacity
              style={styles.addButton}
              onPress={abrirModal}
              accessibilityRole="button"
              accessibilityLabel="Añadir dirección"
            >
              <Ionicons name="add" size={18} color={colors.white} />
              <Text style={styles.addText}>Añadir</Text>
            </TouchableOpacity>
          }
        />

        {direcciones.length === 0 ? (
          <EmptyState
            icono="location-outline"
            titulo="Todavía no tenés direcciones"
            subtitulo="Agregá una con el botón Añadir para poder recibir pedidos."
            style={styles.emptyState}
          />
        ) : null}

        {direcciones.map((d) => {
          const activa: boolean = seleccionada === d.id;
          return (
            <SelectableCard
              key={d.id}
              activo={activa}
              icono="location-outline"
              onPress={() => void elegirDireccion(d)}
              accessibilityLabel={`Usar dirección ${d.alias}`}
            >
              <View style={styles.aliasRow}>
                <Text style={styles.alias}>{d.alias}</Text>
                {d.esPrincipal ? (
                  <View style={styles.principalBadge}>
                    <Text style={styles.principalText}>Principal</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.detalle} numberOfLines={2}>
                {d.detalle}
              </Text>
              <View style={styles.accionesRow}>
                <TouchableOpacity
                  style={styles.accionBtn}
                  onPress={() => abrirEdicion(d)}
                  accessibilityRole="button"
                  accessibilityLabel={`Editar dirección ${d.alias}`}
                >
                  <Ionicons name="create-outline" size={16} color={colors.primary} />
                  <Text style={styles.accionBtnText}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.accionBtn}
                  onPress={() => void eliminarDireccion(d)}
                  accessibilityRole="button"
                  accessibilityLabel={`Eliminar dirección ${d.alias}`}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.error} />
                  <Text style={[styles.accionBtnText, { color: colors.error }]}>
                    Eliminar
                  </Text>
                </TouchableOpacity>
              </View>
            </SelectableCard>
          );
        })}
      </ScrollView>

      <Modal
        visible={modalVisible && !mapaVisible}
        transparent
        animationType="fade"
        onRequestClose={cerrarModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {editandoId !== null ? 'Editar dirección' : 'Nueva dirección'}
            </Text>
            <FormField
              label="Alias"
              value={alias}
              onChangeText={setAlias}
              placeholder="Ej. Casa, Trabajo"
              error={aliasError}
              autoCapitalize="words"
            />
            <FormField
              label="Dirección"
              value={detalle}
              onChangeText={setDetalle}
              placeholder="Ej. Av. Arequipa 2450, Lima"
              error={detalleError}
            />
            <TouchableOpacity
              style={styles.mapButton}
              onPress={() => setMapaVisible(true)}
              accessibilityRole="button"
            >
              <Ionicons name="map-outline" size={18} color={colors.primary} />
              <Text style={styles.mapButtonText}>
                {coordenadas ? 'Ubicación en mapa seleccionada' : 'Elegir en mapa'}
              </Text>
            </TouchableOpacity>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={cerrarModal}
                accessibilityRole="button"
                accessibilityLabel="Cancelar"
              >
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={guardarDireccion}
                accessibilityRole="button"
                accessibilityLabel="Guardar dirección"
              >
                <Text style={styles.saveText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {mapaVisible ? <MapaSelector
        visible={mapaVisible}
        initial={coordenadas}
        initialAddress={detalle}
        onClose={() => setMapaVisible(false)}
        onConfirm={(nuevas, direccion) => {
          setCoordenadas(nuevas);
          if (direccion) setDetalle(direccion);
          setMapaVisible(false);
        }}
      /> : null}
    </View>
  );
}

function makeStyles(c: Colors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.background },
    container: { flexGrow: 1, gap: 10, padding: 16, backgroundColor: c.background },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 12,
      backgroundColor: c.primary,
    },
    addText: { color: c.white, fontSize: 13, fontWeight: '800' },

    aliasRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    alias: { color: c.textPrimary, fontSize: 16, fontWeight: '800' },
    principalBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
      backgroundColor: c.primarySoft,
    },
    principalText: { color: c.primary, fontSize: 11, fontWeight: '800' },
    detalle: { color: c.textMuted, fontSize: 13 },
    accionesRow: {
      flexDirection: 'row',
      gap: 14,
      marginTop: 6,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    accionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 8,
      backgroundColor: c.background,
    },
    accionBtnText: { color: c.primary, fontSize: 12, fontWeight: '700' },
    emptyState: { paddingVertical: 24, paddingHorizontal: 8 },

    modalOverlay: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      backgroundColor: 'rgba(15, 23, 42, 0.45)',
    },
    modalCard: {
      width: '100%',
      gap: 16,
      padding: 20,
      borderRadius: 16,
      backgroundColor: c.surface,
    },
    modalTitle: { color: c.textPrimary, fontSize: 17, fontWeight: '800' },
    mapButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: 12, backgroundColor: c.primarySoft },
    mapButtonText: { color: c.primary, fontSize: 14, fontWeight: '800' },
    modalActions: { flexDirection: 'row', gap: 10 },
    cancelButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    cancelText: { color: c.textMuted, fontSize: 14, fontWeight: '700' },
    saveButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
      backgroundColor: c.primary,
    },
    saveText: { color: c.white, fontSize: 14, fontWeight: '800' },
  });
}
