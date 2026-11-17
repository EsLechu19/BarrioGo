import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Producto } from '../../types/Producto';
import { SeccionCard } from '../SeccionCard';
import { useColors } from '../../context/ThemeContext';
import type { Colors } from '../../styles/colors';
import {
  SECCIONES_CARTA,
  SeccionCarta,
  esSeccionCarta,
  resumenDias,
} from '../../utils/cartaDiaria';

// Sección Mi menú: lista de productos con acciones (editar, pausar y
// eliminar persisten en Firestore vía api.ts) + alta real de producto.
// Restaurantes (carta diaria): el form es solo Nombre + Sección (el precio
// lo define el combo/extra del negocio en Mi local).
type Props = {
  menuVisible: Producto[];
  loadingMenu: boolean;
  menuError: string | null;
  pausados: string[];
  editandoId: string | null;
  editNombre: string;
  editPrecio: string;
  editDescripcion: string;
  editFoto: string | null;
  editFotoError: string | null;
  editGuardando: boolean;
  editSeccion: SeccionCarta;
  onEditNombreChange: (texto: string) => void;
  onEditPrecioChange: (texto: string) => void;
  onEditDescripcionChange: (texto: string) => void;
  onEditSeccionChange: (seccion: SeccionCarta) => void;
  onSubirFotoEdicion: () => void;
  onVerDetalle: () => void;
  onEmpezarEdicion: (producto: Producto) => void;
  onCancelarEdicion: () => void;
  onGuardarEdicion: (productoId: string) => void;
  // Pausar alterna `disponible` y eliminar borra de verdad; la confirmación
  // y el manejo de error los hace la pantalla padre.
  onTogglePausar: (productoId: string) => void | Promise<void>;
  onEliminar: (productoId: string) => void | Promise<void>;

  esRestaurante: boolean;
  nombre: string;
  precio: string;
  descripcion: string;
  seccionSel: SeccionCarta;
  onNombreChange: (texto: string) => void;
  onPrecioChange: (texto: string) => void;
  onDescripcionChange: (texto: string) => void;
  onSeccionChange: (seccion: SeccionCarta) => void;
  guardando: boolean;
  formError: string | null;
  formOk: string | null;
  onGuardarProducto: () => void;
  fotoUri: string | null;
  fotoError: string | null;
  onElegirFoto: () => void;
  onTomarFoto: () => void;
};

export function Menu({
  menuVisible,
  loadingMenu,
  menuError,
  pausados,
  editandoId,
  editNombre,
  editPrecio,
  editDescripcion,
  editFoto,
  editFotoError,
  editGuardando,
  editSeccion,
  onEditNombreChange,
  onEditPrecioChange,
  onEditDescripcionChange,
  onEditSeccionChange,
  onSubirFotoEdicion,
  onVerDetalle,
  onEmpezarEdicion,
  onCancelarEdicion,
  onGuardarEdicion,
  onTogglePausar,
  onEliminar,
  esRestaurante,
  nombre,
  precio,
  descripcion,
  seccionSel,
  onNombreChange,
  onPrecioChange,
  onDescripcionChange,
  onSeccionChange,
  guardando,
  formError,
  formOk,
  onGuardarProducto,
  fotoUri,
  fotoError,
  onElegirFoto,
  onTomarFoto,
}: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  // Filtro por sección (carta diaria): null = "Todos".
  const [filtroSeccion, setFiltroSeccion] = useState<SeccionCarta | null>(null);
  const lista: Producto[] = useMemo(
    () =>
      filtroSeccion
        ? menuVisible.filter((p) => (esSeccionCarta(p.categoriaProducto) ? p.categoriaProducto : 'Menú') === filtroSeccion)
        : menuVisible,
    [filtroSeccion, menuVisible],
  );
  return (
    <ScrollView contentContainerStyle={styles.sectionScroll} showsVerticalScrollIndicator={false}>
      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Mi menú ({lista.length})</Text>
        {loadingMenu ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : null}
      </View>
      {/* Filtros de sección (solo restaurantes con carta diaria) */}
      {esRestaurante ? (
        <View style={styles.chipsRow}>
          <TouchableOpacity
            style={[styles.chip, filtroSeccion === null && styles.chipActivo]}
            onPress={() => setFiltroSeccion(null)}
            accessibilityRole="button"
            accessibilityState={{ selected: filtroSeccion === null }}
          >
            <Text style={[styles.chipText, filtroSeccion === null && styles.chipTextActivo]}>
              Todos
            </Text>
          </TouchableOpacity>
          {SECCIONES_CARTA.map((sec) => {
            const activa: boolean = filtroSeccion === sec;
            return (
              <TouchableOpacity
                key={sec}
                style={[styles.chip, activa && styles.chipActivo]}
                onPress={() => setFiltroSeccion(activa ? null : sec)}
                accessibilityRole="button"
                accessibilityState={{ selected: activa }}
                accessibilityLabel={`Filtrar por ${sec}`}
              >
                <Text style={[styles.chipText, activa && styles.chipTextActivo]}>
                  {sec}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}
      {menuError ? <Text style={styles.error}>{menuError}</Text> : null}
      {loadingMenu ? (
        <View style={styles.centerRow}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.subtitle}>Cargando tu menú...</Text>
        </View>
      ) : menuVisible.length === 0 ? (
        <View style={styles.centerRow}>
          <Text style={styles.subtitle}>
            Todavía no publicas productos. Añade el primero abajo.
          </Text>
        </View>
      ) : lista.length === 0 ? (
        <View style={styles.centerRow}>
          <Text style={styles.subtitle}>No hay platos en esta sección.</Text>
        </View>
      ) : (
        lista.map((item) => {
          const pausado: boolean = pausados.includes(item.id);
          const editando: boolean = editandoId === item.id;
          return (
            <SeccionCard
              key={item.id}
              titulo={item.nombre}
              subtitulo={
                esRestaurante
                  ? // Carta diaria: el precio no vive en el plato; se muestra
                    // sección + días ("Menú · L M X").
                    `${esSeccionCarta(item.categoriaProducto) ? item.categoriaProducto : 'Menú'} · ${resumenDias(item.diasSemana)}`
                  : `S/${item.precio.toFixed(2)}`
              }
              foto={item.imagen}
              icono="fast-food-outline"
              atenuada={pausado}
              badgeTexto={pausado ? 'Pausado' : 'Disponible'}
              badgeColor={pausado ? colors.textMuted : colors.success}
            >
              {item.descripcion?.trim() ? (
                <Text style={styles.itemDesc}>{item.descripcion}</Text>
              ) : null}
              {editando ? (
                <View style={styles.editBox}>
                  <TextInput
                    style={styles.input}
                    placeholder="Nombre del producto"
                    placeholderTextColor={colors.textPlaceholder}
                    value={editNombre}
                    onChangeText={onEditNombreChange}
                  />
                  {esRestaurante ? (
                    <>
                      {/* Carta diaria: sección + foto (sin precio/descripción) */}
                      <View style={styles.chipsRow}>
                        {SECCIONES_CARTA.map((sec) => {
                          const activa: boolean = editSeccion === sec;
                          return (
                            <TouchableOpacity
                              key={sec}
                              style={[styles.chip, activa && styles.chipActivo]}
                              onPress={() => onEditSeccionChange(sec)}
                              accessibilityRole="button"
                              accessibilityState={{ selected: activa }}
                            >
                              <Text style={[styles.chipText, activa && styles.chipTextActivo]}>
                                {sec}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                      <View style={styles.fotoRow}>
                        {editFoto?.trim() ? (
                          <Image source={{ uri: editFoto }} style={styles.fotoPreview} />
                        ) : (
                          <View style={[styles.fotoPreview, styles.fotoPlaceholder]}>
                            <Text style={styles.fotoPlaceholderText}>Sin foto</Text>
                          </View>
                        )}
                        <View style={styles.fotoInfo}>
                          <Text style={styles.fotoLabel}>Foto del plato</Text>
                          <TouchableOpacity
                            style={[styles.fotoButton, styles.fotoButtonRow]}
                            onPress={onSubirFotoEdicion}
                            accessibilityRole="button"
                            accessibilityLabel="Subir foto del plato"
                          >
                            <Ionicons name="image-outline" size={14} color={colors.primary} />
                            <Text style={[styles.fotoButtonText, styles.fotoButtonTextPrimary]}>
                              Subir foto
                            </Text>
                          </TouchableOpacity>
                          {editFotoError ? (
                            <Text style={styles.error}>{editFotoError}</Text>
                          ) : null}
                        </View>
                      </View>
                    </>
                  ) : (
                    <>
                      <TextInput
                        style={styles.input}
                        placeholder="Precio"
                        placeholderTextColor={colors.textPlaceholder}
                        value={editPrecio}
                        onChangeText={onEditPrecioChange}
                        keyboardType="decimal-pad"
                      />
                      <TextInput
                        style={[styles.input, styles.descInput]}
                        placeholder="Descripción (opcional)"
                        placeholderTextColor={colors.textPlaceholder}
                        value={editDescripcion}
                        onChangeText={onEditDescripcionChange}
                        multiline
                      />
                      {/* Foto del producto en edición */}
                      <View style={styles.fotoRow}>
                        {editFoto?.trim() ? (
                          <Image source={{ uri: editFoto }} style={styles.fotoPreview} />
                        ) : (
                          <View style={[styles.fotoPreview, styles.fotoPlaceholder]}>
                            <Text style={styles.fotoPlaceholderText}>Sin foto</Text>
                          </View>
                        )}
                        <View style={styles.fotoInfo}>
                          <Text style={styles.fotoLabel}>Foto del producto</Text>
                          <TouchableOpacity
                            style={[styles.fotoButton, styles.fotoButtonRow]}
                            onPress={onSubirFotoEdicion}
                            accessibilityRole="button"
                            accessibilityLabel="Subir foto del producto"
                          >
                            <Ionicons name="image-outline" size={14} color={colors.primary} />
                            <Text style={[styles.fotoButtonText, styles.fotoButtonTextPrimary]}>
                              Subir foto
                            </Text>
                          </TouchableOpacity>
                          {editFotoError ? (
                            <Text style={styles.error}>{editFotoError}</Text>
                          ) : null}
                        </View>
                      </View>
                    </>
                  )}
                  <View style={styles.editActions}>
                    <TouchableOpacity
                      style={styles.ghostButton}
                      onPress={onCancelarEdicion}
                    >
                      <Text style={styles.ghostText}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.smallPrimaryButton}
                      disabled={editGuardando}
                      onPress={() => onGuardarEdicion(item.id)}
                    >
                      <Text style={styles.primaryText}>Guardar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}
              <View style={styles.menuActions}>
                <TouchableOpacity
                  style={styles.menuAction}
                  onPress={onVerDetalle}
                  accessibilityRole="button"
                  accessibilityLabel={`Ver ${item.nombre} en Detalle`}
                >
                  <Ionicons name="eye-outline" size={16} color={colors.primary} />
                  <Text style={styles.menuActionText}>Ver</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuAction}
                  onPress={() =>
                    editando ? onCancelarEdicion() : onEmpezarEdicion(item)
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`Modificar ${item.nombre}`}
                >
                  <Ionicons name="create-outline" size={16} color={colors.primary} />
                  <Text style={styles.menuActionText}>
                    {editando ? 'Cerrar' : 'Editar'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuAction}
                  onPress={() => onTogglePausar(item.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`${pausado ? 'Activar' : 'Pausar'} ${item.nombre}`}
                >
                  <Ionicons
                    name={pausado ? 'play-outline' : 'pause-outline'}
                    size={16}
                    color={colors.primary}
                  />
                  <Text style={styles.menuActionText}>
                    {pausado ? 'Activar' : 'Pausar'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuAction}
                  onPress={() => onEliminar(item.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Eliminar ${item.nombre}`}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.error} />
                  <Text style={[styles.menuActionText, { color: colors.error }]}>
                    Quitar
                  </Text>
                </TouchableOpacity>
              </View>
            </SeccionCard>
          );
        })
      )}

      {/* Alta real de producto */}
      <View style={styles.form}>
        <View style={styles.formHeader}>
          <View style={styles.formIcon}>
            <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.formTitle}>Añadir producto</Text>
            <Text style={styles.formSub}>Aparece al instante en Detalle</Text>
          </View>
        </View>
        <TextInput
          style={styles.input}
          placeholder="Nombre del producto"
          placeholderTextColor={colors.textPlaceholder}
          value={nombre}
          onChangeText={onNombreChange}
        />
        {esRestaurante ? (
          // Carta diaria: solo sección (el precio lo cobra el combo/extra).
          <View style={styles.chipsRow}>
            {SECCIONES_CARTA.map((sec) => {
              const activa: boolean = seccionSel === sec;
              return (
                <TouchableOpacity
                  key={sec}
                  style={[styles.chip, activa && styles.chipActivo]}
                  onPress={() => onSeccionChange(sec)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: activa }}
                  accessibilityLabel={`Sección ${sec}`}
                >
                  <Text style={[styles.chipText, activa && styles.chipTextActivo]}>
                    {sec}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <>
            <View style={styles.priceRow}>
              <View style={styles.currencyBadge}>
                <Text style={styles.currencyText}>S/</Text>
              </View>
              <TextInput
                style={[styles.input, styles.priceInput]}
                placeholder="Precio (ej. 12.50)"
                placeholderTextColor={colors.textPlaceholder}
                value={precio}
                onChangeText={onPrecioChange}
                keyboardType="decimal-pad"
              />
            </View>
            <TextInput
              style={[styles.input, styles.descInput]}
              placeholder="Descripción (opcional)"
              placeholderTextColor={colors.textPlaceholder}
              value={descripcion}
              onChangeText={onDescripcionChange}
              multiline
            />
          </>
        )}
        {/* Foto del producto/plato: igual para restaurante y el resto */}
        <View style={styles.fotoRow}>
          {fotoUri ? (
            <Image source={{ uri: fotoUri }} style={styles.fotoPreview} />
          ) : (
            <View style={[styles.fotoPreview, styles.fotoPlaceholder]}>
              <Text style={styles.fotoPlaceholderText}>Sin foto</Text>
            </View>
          )}
          <View style={styles.fotoInfo}>
            <Text style={styles.fotoLabel}>
              {esRestaurante ? 'Foto del plato' : 'Foto del producto'}
            </Text>
            <View style={styles.fotoAcciones}>
              <TouchableOpacity style={styles.fotoButton} onPress={onElegirFoto}>
                <Text style={styles.fotoButtonText}>Galería</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.fotoButton} onPress={onTomarFoto}>
                <Text style={styles.fotoButtonText}>Cámara</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        {fotoError ? <Text style={styles.error}>{fotoError}</Text> : null}
        {formError ? <Text style={styles.error}>{formError}</Text> : null}
        {formOk ? <Text style={styles.ok}>{formOk}</Text> : null}
        <TouchableOpacity
          style={[styles.primaryButton, guardando && styles.disabledButton]}
          disabled={guardando}
          onPress={onGuardarProducto}
        >
          <Ionicons name="save-outline" size={18} color={colors.white} />
          <Text style={styles.primaryText}>
            {guardando ? 'Guardando...' : 'Guardar producto'}
          </Text>
        </TouchableOpacity>
      </View>
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
    subtitle: { color: c.textMuted, fontSize: 14, textAlign: 'center' },
    error: { color: c.error, fontSize: 14, fontWeight: '600' },
    ok: { color: c.success, fontSize: 14, fontWeight: '600' },
    disabledButton: { opacity: 0.6 },
    centerRow: { alignItems: 'center', gap: 8, paddingVertical: 12 },

    menuActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      borderTopWidth: 1,
      borderTopColor: c.border,
      paddingTop: 10,
    },
    menuAction: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: c.background,
    },
    menuActionText: { color: c.primary, fontSize: 12, fontWeight: '700' },
    itemDesc: { color: c.textMuted, fontSize: 13, lineHeight: 18 },
    editBox: { gap: 8, padding: 10, borderRadius: 12, backgroundColor: c.background },
    editActions: { flexDirection: 'row', gap: 8 },
    ghostButton: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    ghostText: { color: c.textMuted, fontSize: 14, fontWeight: '700' },
    smallPrimaryButton: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 12,
      alignItems: 'center',
      backgroundColor: c.primary,
    },

    form: {
      gap: 10,
      padding: 14,
      marginBottom: 100,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 18,
      backgroundColor: c.surface,
    },
    formHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    formIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: c.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    formTitle: { color: c.textPrimary, fontSize: 16, fontWeight: '800' },
    formSub: { color: c.textMuted, fontSize: 12 },
    input: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 15,
      color: c.textPrimary,
      backgroundColor: c.background,
    },
    priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    priceInput: { flex: 1 },
    currencyBadge: {
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 12,
      backgroundColor: c.primarySoft,
    },
    currencyText: { color: c.primary, fontSize: 15, fontWeight: '800' },
    descInput: { minHeight: 64, textAlignVertical: 'top' },
    // Sección del plato (carta diaria)
    chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    chipActivo: { backgroundColor: c.primary, borderColor: c.primary },
    chipText: { color: c.textPrimary, fontSize: 13, fontWeight: '700' },
    chipTextActivo: { color: c.white },
    // Foto del producto (preview de la fila de cámara)
    fotoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    fotoPreview: { width: 72, height: 72, borderRadius: 14 },
    fotoPlaceholder: {
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    fotoPlaceholderText: { color: c.textMuted, fontSize: 12 },
    fotoInfo: { flex: 1, gap: 8 },
    fotoLabel: { color: c.textPrimary, fontSize: 14, fontWeight: '700' },
    fotoAcciones: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    fotoButton: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      opacity: 1,
    },
    fotoButtonText: { color: c.textMuted, fontSize: 13, fontWeight: '700' },
    fotoButtonRow: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
    fotoButtonTextPrimary: { color: c.primary },
    primaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: 14,
      backgroundColor: c.primary,
    },
    primaryText: { color: c.white, fontSize: 15, fontWeight: '700' },
  });
}
