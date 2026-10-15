import { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import type { ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../context/ThemeContext';
import type { Colors } from '../styles/colors';

type IconoNombre = React.ComponentProps<typeof Ionicons>['name'];

// Fila de ajuste/menú: caja de icono + título/subtítulo + slot derecho.
// Si recibe `onPress` se vuelve tocable; si no, es solo presentación.
type Props = {
  icono: IconoNombre;
  titulo: string;
  subtitulo?: string;
  right?: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  tituloStyle?: StyleProp<TextStyle>;
  subtituloStyle?: StyleProp<TextStyle>;
  subtituloNumberOfLines?: number;
  style?: StyleProp<ViewStyle>;
};

export function SettingRow({
  icono,
  titulo,
  subtitulo,
  right,
  onPress,
  accessibilityLabel,
  tituloStyle,
  subtituloStyle,
  subtituloNumberOfLines,
  style,
}: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const contenido = (
    <>
      <View style={styles.iconBox}>
        <Ionicons name={icono} size={20} color={colors.primary} />
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.titulo, tituloStyle]}>{titulo}</Text>
        {subtitulo ? (
          <Text
            style={[styles.subtitulo, subtituloStyle]}
            numberOfLines={subtituloNumberOfLines}
          >
            {subtitulo}
          </Text>
        ) : null}
      </View>
      {right}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.row, style]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? titulo}
      >
        {contenido}
      </TouchableOpacity>
    );
  }

  return <View style={[styles.row, style]}>{contenido}</View>;
}

function makeStyles(c: Colors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 10,
      paddingVertical: 13,
    },
    iconBox: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: c.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowText: { flex: 1, gap: 2 },
    titulo: { color: c.textPrimary, fontSize: 15, fontWeight: '700' },
    subtitulo: { color: c.textMuted, fontSize: 13 },
  });
}
