import { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useColors } from '../context/ThemeContext';
import type { Colors } from '../styles/colors';

// Stepper −/n/+ reutilizable. Los colores y tamaño se pasan por props para
// respetar las variantes de Carrito (34, + pintado) y Detalle (32, plano).
type Props = {
  cantidad: number;
  onDecrement: () => void;
  onIncrement: () => void;
  size?: number;
  radius?: number;
  plusRelleno?: boolean;
  gap?: number;
  minWidth?: number;
  colorTexto?: string;
  colorTextoPlus?: string;
};

export function CantidadStepper({
  cantidad,
  onDecrement,
  onIncrement,
  size = 34,
  radius,
  plusRelleno = true,
  gap = 8,
  minWidth = 20,
  colorTexto,
  colorTextoPlus,
}: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const radio: number = radius ?? size / 2;
  const dimensiones = { width: size, height: size, borderRadius: radio };
  return (
    <View style={[styles.row, { gap }]}>
      <TouchableOpacity style={[styles.button, dimensiones]} onPress={onDecrement}>
        <Text style={[styles.texto, colorTexto ? { color: colorTexto } : null]}>
          −
        </Text>
      </TouchableOpacity>
      <Text style={[styles.qty, { minWidth }]}>{cantidad}</Text>
      <TouchableOpacity
        style={[styles.button, dimensiones, plusRelleno && styles.plus]}
        onPress={onIncrement}
      >
        <Text
          style={[
            styles.texto,
            plusRelleno
              ? colorTextoPlus
                ? { color: colorTextoPlus }
                : null
              : colorTexto
                ? { color: colorTexto }
                : null,
          ]}
        >
          +
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function makeStyles(c: Colors) {
  return StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center' },
    button: {
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: c.background,
      borderWidth: 1,
      borderColor: c.border,
    },
    plus: { backgroundColor: c.primary, borderColor: c.primary },
    texto: { fontSize: 18, fontWeight: '700', color: c.textPrimary },
    qty: { textAlign: 'center', fontSize: 15, fontWeight: '700', color: c.textPrimary },
  });
}
