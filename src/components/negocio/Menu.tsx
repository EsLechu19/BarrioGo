import {
  ActivityIndicator,
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
import { colors } from '../../styles/colors';

// Sección Mi menú: lista de productos con acciones (pausar/editar/quitar,
// solo diseño en memoria) + alta real de producto.
type Props = {
  menuVisible: Producto[];
  loadingMenu: boolean;
  menuError: string | null;
  pausados: string[];
  editandoId: string | null;
  editNombre: string;
  editPrecio: string;
  onEditNombreChange: (texto: string) => void;
  onEditPrecioChange: (texto: string) => void;
  onVerDetalle: () => void;
  onEmpezarEdicion: (producto: Producto) => void;
  onCancelarEdicion: () => void;
  onGuardarEdicion: (productoId: string) => void;
  onTogglePausar: (productoId: string) => void;
  onEliminar: (productoId: string) => void;

  nombre: string;
  precio: string;
  descripcion: string;
  onNombreChange: (texto: string) => void;
  onPrecioChange: (texto: string) => void;
  onDescripcionChange: (texto: string) => void;
  guardando: boolean;
  formError: string | null;
  formOk: string | null;
  onGuardarProducto: () => void;
};

export function Menu({
  menuVisible,
  loadingMenu,
  menuError,
  pausados,
  editandoId,
  editNombre,
  editPrecio,
  onEditNombreChange,
  onEditPrecioChange,
  onVerDetalle,
  onEmpezarEdicion,
  onCancelarEdicion,
  onGuardarEdicion,
  onTogglePausar,
  onEliminar,
  nombre,
  precio,
  descripcion,
  onNombreChange,
  onPrecioChange,
  onDescripcionChange,
  guardando,
  formError,
  formOk,
  onGuardarProducto,
}: Props) {
  return (
    <ScrollView contentContainerStyle={styles.sectionScroll} showsVerticalScrollIndicator={false}>
      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Mi menú ({menuVisible.length})</Text>
        {loadingMenu ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : null}
      </View>
      {menuError ? <Text style={styles.error}>{menuError}</Text> : null}
      {loadingMenu ? (
        <View style={styles.centerRow}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.subtitle}>Cargando tu menú...</Text>
        </View>
      ) : menuVisible.length === 0 ? (
        <View style={styles.centerRow}>
          <Text style={styles.subtitle}>
            Todavía no publicas productos. Añadí el primero abajo.
          </Text>
        </View>
      ) : (
        menuVisible.map((item) => {
          const pausado: boolean = pausados.includes(item.id);
          const editando: boolean = editandoId === item.id;
          return (
            <SeccionCard
              key={item.id}
              titulo={item.nombre}
              subtitulo={`S/${item.precio.toFixed(2)}`}
              foto={item.imagen}
              icono="fast-food-outline"
              atenuada={pausado}
              badgeTexto={pausado ? 'Pausado' : 'Disponible'}
              badgeColor={pausado ? colors.textMuted : colors.success}
            >
              {editando ? (
                <View style={styles.editBox}>
                  <TextInput
                    style={styles.input}
                    placeholder="Nombre del producto"
                    placeholderTextColor={colors.textPlaceholder}
                    value={editNombre}
                    onChangeText={onEditNombreChange}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Precio"
                    placeholderTextColor={colors.textPlaceholder}
                    value={editPrecio}
                    onChangeText={onEditPrecioChange}
                    keyboardType="decimal-pad"
                  />
                  <View style={styles.editActions}>
                    <TouchableOpacity
                      style={styles.ghostButton}
                      onPress={onCancelarEdicion}
                    >
                      <Text style={styles.ghostText}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.smallPrimaryButton}
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
                  accessibilityLabel={`Modificar ${item.nombre} (diseño)`}
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
                  accessibilityLabel={`${pausado ? 'Activar' : 'Pausar'} ${item.nombre} (diseño)`}
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
                  accessibilityLabel={`Eliminar ${item.nombre} (diseño)`}
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
        {/* Foto del producto (plantilla, solo diseño) */}
        <View style={styles.fotoRow}>
          <View style={[styles.fotoPreview, styles.fotoPlaceholder]}>
            <Text style={styles.fotoPlaceholderText}>Sin foto</Text>
          </View>
          <View style={styles.fotoInfo}>
            <Text style={styles.fotoLabel}>Foto del producto</Text>
            <View style={styles.fotoAcciones}>
              <TouchableOpacity style={styles.fotoButton} disabled>
                <Text style={styles.fotoButtonText}>Galería</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.fotoButton} disabled>
                <Text style={styles.fotoButtonText}>Cámara</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        {formError ? <Text style={styles.error}>{formError}</Text> : null}
        {formOk ? <Text style={styles.ok}>{formOk}</Text> : null}
        <TouchableOpacity
          style={[styles.primaryButton, guardando && styles.disabledButton]}
          disabled={guardando}
          onPress={onGuardarProducto}
        >
          <Ionicons name="save-outline" size={18} color={colors.surface} />
          <Text style={styles.primaryText}>
            {guardando ? 'Guardando...' : 'Guardar producto'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  sectionScroll: { gap: 10, paddingBottom: 120 },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '800' },
  subtitle: { color: colors.textMuted, fontSize: 14, textAlign: 'center' },
  error: { color: colors.error, fontSize: 14, fontWeight: '600' },
  ok: { color: colors.success, fontSize: 14, fontWeight: '600' },
  disabledButton: { opacity: 0.6 },
  centerRow: { alignItems: 'center', gap: 8, paddingVertical: 12 },

  menuActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: colors.border,
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
    backgroundColor: colors.background,
  },
  menuActionText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  editBox: { gap: 8, padding: 10, borderRadius: 12, backgroundColor: colors.background },
  editActions: { flexDirection: 'row', gap: 8 },
  ghostButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  ghostText: { color: colors.textMuted, fontSize: 14, fontWeight: '700' },
  smallPrimaryButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: colors.primary,
  },

  form: {
    gap: 10,
    padding: 14,
    marginBottom: 100,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.surface,
  },
  formHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  formIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '800' },
  formSub: { color: colors.textMuted, fontSize: 12 },
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
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  priceInput: { flex: 1 },
  currencyBadge: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
  },
  currencyText: { color: colors.primary, fontSize: 15, fontWeight: '800' },
  descInput: { minHeight: 64, textAlignVertical: 'top' },
  // Foto del producto (plantilla, solo diseño)
  fotoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  fotoPreview: { width: 72, height: 72, borderRadius: 14 },
  fotoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fotoPlaceholderText: { color: colors.textMuted, fontSize: 12 },
  fotoInfo: { flex: 1, gap: 8 },
  fotoLabel: { color: colors.textPrimary, fontSize: 14, fontWeight: '700' },
  fotoAcciones: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  fotoButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    opacity: 0.7,
  },
  fotoButtonText: { color: colors.textMuted, fontSize: 13, fontWeight: '700' },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    backgroundColor: colors.primary,
  },
  primaryText: { color: colors.surface, fontSize: 15, fontWeight: '700' },
});
