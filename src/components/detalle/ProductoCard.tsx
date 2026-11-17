import { memo, useMemo } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Producto } from '../../types/Producto';
import { CantidadStepper } from '../CantidadStepper';
import { useColors } from '../../context/ThemeContext';
import type { Colors } from '../../styles/colors';

// Card de producto del menú: foto/icono + info + botón Agregar o stepper.
// `modoSeleccion` = carta diaria (radio 1 entrada / 1 comida): oculta el
// precio y cambia Agregar por un radio; `seleccionado` marca el radio activo.
// `sinPrecio` = extra de la carta: el precio vive en el título de la
// sección, no en cada card.
type Props = {
  producto: Producto;
  cantidad: number;
  onAgregar: () => void;
  onDecrement: () => void;
  onIncrement: () => void;
  modoSeleccion?: boolean;
  seleccionado?: boolean;
  sinPrecio?: boolean;
};

// memo: la lista del menú re-renderiza seguido (cantidades, filtros); la card
// solo cambia si el producto o su estado de selección/cantidad cambian.
function ProductoCardBase({
  producto,
  cantidad,
  onAgregar,
  onDecrement,
  onIncrement,
  modoSeleccion = false,
  seleccionado = false,
  sinPrecio = false,
}: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const descripcion: string = producto.descripcion?.trim() ?? '';
  return (
    <View style={[styles.card, seleccionado && styles.cardSeleccionado]}>
      {/* Foto producto o icono si no hay foto */}
      {producto.imagen?.trim() ? (
        <Image
          source={{ uri: producto.imagen }}
          style={styles.thumb}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.thumb, styles.thumbPlaceholder]}>
          <Ionicons name="fast-food-outline" size={28} color={colors.textPlaceholder} />
        </View>
      )}
      {/*Informacion */}
      <View style={styles.cardInfo}>
        <Text style={styles.dish}>{producto.nombre}</Text>
        {descripcion ? <Text style={styles.desc}>{descripcion}</Text> : null}
        {!modoSeleccion && !sinPrecio ? (
          <Text style={styles.price}>S/{producto.precio.toFixed(2)}</Text>
        ) : null}
      </View>
      {modoSeleccion ? (
        <TouchableOpacity
          style={[styles.radio, seleccionado && styles.radioActivo]}
          onPress={onAgregar}
          accessibilityRole="radio"
          accessibilityState={{ selected: seleccionado }}
          accessibilityLabel={`Elegir ${producto.nombre}`}
        >
          {seleccionado ? (
            <Ionicons name="checkmark" size={16} color={colors.white} />
          ) : null}
        </TouchableOpacity>
      ) : cantidad === 0 ? (
        <TouchableOpacity style={styles.addButton} onPress={onAgregar}>
          <Text style={styles.addText}>Agregar</Text>
        </TouchableOpacity>
      ) : (
        <CantidadStepper
          cantidad={cantidad}
          onDecrement={onDecrement}
          onIncrement={onIncrement}
          size={32}
          radius={10}
          plusRelleno={false}
          minWidth={18}
        />
      )}
    </View>
  );
}

export const ProductoCard = memo(ProductoCardBase);

function makeStyles(c: Colors) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: 12,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      backgroundColor: c.surface,
    },
    cardSeleccionado: { borderColor: c.primary },
    thumb: { width: 80, height: 80, borderRadius: 12, backgroundColor: c.border },
    thumbPlaceholder: {
      backgroundColor: c.background,
      borderWidth: 1,
      borderColor: c.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cardInfo: { flex: 1, gap: 2 },
    dish: { color: c.textPrimary, fontSize: 15, fontWeight: '700' },
    desc: { color: c.textMuted, fontSize: 13 },
    price: { color: c.primary, fontSize: 14, fontWeight: '700' },
    addButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: c.primary },
    addText: { color: c.white, fontSize: 14, fontWeight: '700' },
    radio: {
      width: 26,
      height: 26,
      borderRadius: 13,
      borderWidth: 2,
      borderColor: c.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    radioActivo: { backgroundColor: c.primary, borderColor: c.primary },
  });
}
