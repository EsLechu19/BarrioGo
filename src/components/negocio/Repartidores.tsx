import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EmptyState } from '../EmptyState';
import { EstadoRepartidor, Repartidor } from '../../types/Repartidor';
import { ESTADO_REPARTIDOR_LABEL } from '../../utils/estadosPedido';
import { useColors } from '../../context/ThemeContext';
import type { Colors } from '../../styles/colors';

// Sección Repartidores: alta, cambio de estado y baja sobre la colección
// `repartidores`. Las acciones llegan por props desde NegocioScreen.
const ESTADOS: EstadoRepartidor[] = ['disponible', 'en_ruta', 'descanso'];

const TELEFONO_REGEX: RegExp = /^[0-9+\s-]{6,15}$/;

type Props = {
  repartidores: Repartidor[];
  cargando: boolean;
  error: string | null;
  // Estas acciones lanzan error (el componente lo muestra donde corresponde).
  onCrear: (nombre: string, telefono: string) => Promise<void>;
  onCambiarEstado: (repartidor: Repartidor, estado: EstadoRepartidor) => Promise<void>;
  onEliminar: (repartidor: Repartidor) => Promise<void>;
};

export function Repartidores({
  repartidores,
  cargando,
  error,
  onCrear,
  onCambiarEstado,
  onEliminar,
}: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [mostrarForm, setMostrarForm] = useState<boolean>(false);
  const [nombre, setNombre] = useState<string>('');
  const [telefono, setTelefono] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState<boolean>(false);
  const [accionandoId, setAccionandoId] = useState<string | null>(null);

  function alternarForm(): void {
    setMostrarForm((prev) => !prev);
    setFormError(null);
  }

  function cancelarForm(): void {
    setMostrarForm(false);
    setFormError(null);
    setNombre('');
    setTelefono('');
  }

  async function agregar(): Promise<void> {
    const nombreOk: string = nombre.trim();
    if (nombreOk.length < 3) {
      setFormError('El nombre necesita al menos 3 caracteres.');
      return;
    }
    const tel: string = telefono.trim();
    if (tel && !TELEFONO_REGEX.test(tel)) {
      setFormError('El teléfono no es válido (ej. 999 888 777).');
      return;
    }
    setGuardando(true);
    setFormError(null);
    try {
      await onCrear(nombreOk, tel);
      cancelarForm();
    } catch (e) {
      setFormError(
        e instanceof Error ? e.message : 'No se pudo crear el repartidor. Intentá de nuevo.',
      );
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarEstado(r: Repartidor, estado: EstadoRepartidor): Promise<void> {
    if (accionandoId) return;
    setAccionandoId(r.id);
    try {
      await onCambiarEstado(r, estado);
    } catch (e) {
      Alert.alert(
        'No se pudo actualizar',
        e instanceof Error ? e.message : 'Intentá de nuevo.',
      );
    } finally {
      setAccionandoId(null);
    }
  }

  function confirmarEliminacion(r: Repartidor): void {
    Alert.alert(
      '¿Eliminar repartidor?',
      `${r.nombre} va a dejar de estar en tu equipo.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setAccionandoId(r.id);
              try {
                await onEliminar(r);
              } catch (e) {
                Alert.alert(
                  'No se pudo eliminar',
                  e instanceof Error ? e.message : 'Intentá de nuevo.',
                );
              } finally {
                setAccionandoId(null);
              }
            })();
          },
        },
      ],
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.sectionScroll} showsVerticalScrollIndicator={false}>
      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Repartidores</Text>
        <TouchableOpacity
          style={[styles.addButton, guardando && styles.disabledButton]}
          onPress={alternarForm}
          disabled={guardando}
          accessibilityRole="button"
          accessibilityLabel={mostrarForm ? 'Cerrar formulario' : 'Añadir repartidor'}
        >
          <Ionicons name={mostrarForm ? 'close' : 'add'} size={18} color={colors.white} />
          <Text style={styles.addText}>{mostrarForm ? 'Cerrar' : 'Añadir'}</Text>
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {/* Formulario de alta */}
      {mostrarForm ? (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Nuevo repartidor</Text>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Nombre y apellido *</Text>
            <TextInput
              value={nombre}
              onChangeText={setNombre}
              placeholder="Ej. Juan Pérez"
              placeholderTextColor={colors.textPlaceholder}
              maxLength={40}
              style={styles.input}
              accessibilityLabel="Nombre del repartidor"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Teléfono (opcional)</Text>
            <TextInput
              value={telefono}
              onChangeText={setTelefono}
              placeholder="Ej. 999 888 777"
              placeholderTextColor={colors.textPlaceholder}
              keyboardType="phone-pad"
              maxLength={15}
              style={styles.input}
              accessibilityLabel="Teléfono del repartidor"
            />
          </View>
          {formError ? <Text style={styles.error}>{formError}</Text> : null}
          <View style={styles.formActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={cancelarForm}
              disabled={guardando}
              accessibilityRole="button"
              accessibilityLabel="Cancelar alta"
            >
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, guardando && styles.disabledButton]}
              onPress={() => void agregar()}
              disabled={guardando}
              accessibilityRole="button"
              accessibilityLabel="Guardar repartidor"
            >
              <Text style={styles.saveText}>{guardando ? 'Guardando...' : 'Agregar'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {/* Lista */}
      {cargando ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loading} />
      ) : repartidores.length === 0 ? (
        <EmptyState
          icono="bicycle-outline"
          titulo="Todavía no tenés repartidores"
          subtitulo="Agregá al primero con el botón Añadir: va a aparecer acá al instante."
          style={styles.empty}
        />
      ) : (
        repartidores.map((r) => {
          const ocupado: boolean = accionandoId === r.id;
          return (
            <View key={r.id} style={[styles.repCard, ocupado && styles.repCardBusy]}>
              <View style={styles.repTop}>
                <View style={styles.repAvatar}>
                  <Text style={styles.repInitial}>
                    {r.nombre.trim().charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.repInfo}>
                  <Text style={styles.repNombre} numberOfLines={1}>
                    {r.nombre}
                  </Text>
                  <Text style={styles.repMeta}>
                    {r.telefono?.trim() ? r.telefono : 'Sin teléfono'} · {r.entregasHoy} entregas hoy
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => confirmarEliminacion(r)}
                  hitSlop={8}
                  disabled={ocupado}
                  accessibilityRole="button"
                  accessibilityLabel={`Eliminar a ${r.nombre}`}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.error} />
                </TouchableOpacity>
              </View>
              <View style={styles.estadosRow}>
                {ESTADOS.map((valor) => {
                  const activo: boolean = r.estado === valor;
                  const etiqueta: string = ESTADO_REPARTIDOR_LABEL[valor];
                  return (
                    <TouchableOpacity
                      key={valor}
                      style={[styles.estadoChip, activo && styles.estadoChipActivo]}
                      onPress={() => void cambiarEstado(r, valor)}
                      disabled={ocupado}
                      accessibilityRole="button"
                      accessibilityState={{ selected: activo }}
                      accessibilityLabel={`${r.nombre}: ${etiqueta}`}
                    >
                      <Text
                        style={[styles.estadoText, activo && styles.estadoTextActivo]}
                      >
                        {etiqueta}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

function makeStyles(c: Colors) {
  return StyleSheet.create({
    sectionScroll: { gap: 10, paddingBottom: 120 },
    sectionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    sectionTitle: { color: c.textPrimary, fontSize: 18, fontWeight: '800' },
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
    disabledButton: { opacity: 0.6 },
    error: { color: c.error, fontSize: 13, fontWeight: '600' },
    loading: { paddingVertical: 24 },
    empty: { paddingVertical: 24 },

    // Formulario
    formCard: {
      gap: 10,
      padding: 14,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      backgroundColor: c.surface,
    },
    formTitle: { color: c.textPrimary, fontSize: 15, fontWeight: '800' },
    field: { gap: 4 },
    fieldLabel: { color: c.textMuted, fontSize: 12, fontWeight: '600' },
    input: {
      height: 44,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 10,
      backgroundColor: c.background,
      fontSize: 15,
      color: c.textPrimary,
    },
    formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 4 },
    cancelButton: {
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
    },
    cancelText: { color: c.textMuted, fontSize: 14, fontWeight: '700' },
    saveButton: {
      paddingVertical: 10,
      paddingHorizontal: 18,
      borderRadius: 12,
      backgroundColor: c.primary,
    },
    saveText: { color: c.white, fontSize: 14, fontWeight: '700' },

    // Lista
    repCard: {
      gap: 10,
      padding: 12,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      backgroundColor: c.surface,
    },
    repCardBusy: { opacity: 0.6 },
    repTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    repAvatar: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.primarySoft,
    },
    repInitial: { color: c.primary, fontSize: 16, fontWeight: '900' },
    repInfo: { flex: 1, gap: 2 },
    repNombre: { color: c.textPrimary, fontSize: 15, fontWeight: '700' },
    repMeta: { color: c.textMuted, fontSize: 12 },
    estadosRow: { flexDirection: 'row', gap: 6 },
    estadoChip: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 7,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
    },
    estadoChipActivo: { backgroundColor: c.primary, borderColor: c.primary },
    estadoText: { color: c.textMuted, fontSize: 12, fontWeight: '700' },
    estadoTextActivo: { color: c.white },
  });
}
