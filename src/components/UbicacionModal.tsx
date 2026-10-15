import { useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FormField } from './FormField';
import { useColors } from '../context/ThemeContext';
import type { Colors } from '../styles/colors';
import type { DireccionUsuario } from '../types/Direccion';

// Modal de ubicación del Home: lista las direcciones del usuario para
// elegirla de un toque y permite añadir una nueva sin salir del inicio.
type Props = {
  visible: boolean;
  direcciones: DireccionUsuario[];
  seleccionadaId: string | null;
  onCerrar: () => void;
  onElegir: (direccion: DireccionUsuario) => void;
  onGuardar: (direccion: DireccionUsuario) => void;
};

export function UbicacionModal({
  visible,
  direcciones,
  seleccionadaId,
  onCerrar,
  onElegir,
  onGuardar,
}: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [mostrarForm, setMostrarForm] = useState<boolean>(false);
  const [alias, setAlias] = useState<string>('');
  const [detalle, setDetalle] = useState<string>('');
  const [aliasError, setAliasError] = useState<string | undefined>(undefined);
  const [detalleError, setDetalleError] = useState<string | undefined>(undefined);

  const abrirForm = (): void => {
    setAlias('');
    setDetalle('');
    setAliasError(undefined);
    setDetalleError(undefined);
    setMostrarForm(true);
  };

  const cerrarForm = (): void => {
    setMostrarForm(false);
  };

  const guardar = (): void => {
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
    onGuardar({
      id: `d${Date.now()}`,
      alias: aliasLimpio,
      detalle: detalleLimpio,
      esPrincipal: direcciones.length === 0,
    });
    setMostrarForm(false);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCerrar}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Ubicación</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onCerrar}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Cerrar ubicación"
            >
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {!mostrarForm && direcciones.length > 0 ? (
            <ScrollView style={styles.lista} contentContainerStyle={styles.listaContent}>
              {direcciones.map((d) => {
                const activa: boolean = seleccionadaId === d.id;
                return (
                  <TouchableOpacity
                    key={d.id}
                    style={[styles.item, activa && styles.itemActivo]}
                    onPress={() => onElegir(d)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: activa }}
                    accessibilityLabel={`Usar dirección ${d.alias}: ${d.detalle}`}
                  >
                    <Ionicons
                      name={activa ? 'location' : 'location-outline'}
                      size={20}
                      color={activa ? colors.primary : colors.textMuted}
                    />
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemAlias} numberOfLines={1}>
                        {d.alias}
                      </Text>
                      <Text style={styles.itemDetalle} numberOfLines={1}>
                        {d.detalle}
                      </Text>
                    </View>
                    {activa ? (
                      <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : null}

          {mostrarForm ? (
            <View style={styles.form}>
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
              <View style={styles.formActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={cerrarForm}
                  accessibilityRole="button"
                  accessibilityLabel="Cancelar"
                >
                  <Text style={styles.cancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={guardar}
                  accessibilityRole="button"
                  accessibilityLabel="Guardar dirección"
                >
                  <Text style={styles.saveText}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addButton}
              onPress={abrirForm}
              accessibilityRole="button"
              accessibilityLabel="Añadir ubicación"
            >
              <Ionicons name="add" size={18} color={colors.white} />
              <Text style={styles.addText}>Añadir ubicación</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

function makeStyles(c: Colors) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'center',
      padding: 24,
      backgroundColor: 'rgba(15, 23, 42, 0.45)',
    },
    card: {
      width: '100%',
      maxHeight: '80%',
      gap: 14,
      padding: 20,
      borderRadius: 16,
      backgroundColor: c.surface,
    },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    title: { color: c.textPrimary, fontSize: 17, fontWeight: '800' },
    closeButton: { padding: 4, borderRadius: 12 },

    lista: { flexGrow: 0 },
    listaContent: { gap: 8 },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: 12,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      backgroundColor: c.surface,
    },
    itemActivo: { borderColor: c.primary, backgroundColor: c.primarySoft },
    itemInfo: { flex: 1, gap: 2 },
    itemAlias: { color: c.textPrimary, fontSize: 14, fontWeight: '800' },
    itemDetalle: { color: c.textMuted, fontSize: 12 },

    form: { gap: 14 },
    formActions: { flexDirection: 'row', gap: 10 },
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

    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: c.primary,
    },
    addText: { color: c.white, fontSize: 14, fontWeight: '800' },
  });
}
