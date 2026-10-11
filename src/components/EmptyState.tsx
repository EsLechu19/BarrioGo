import { StyleSheet, Text, View } from 'react-native';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import type { ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/colors';

type IconoNombre = React.ComponentProps<typeof Ionicons>['name'];

// Estado vacío: círculo con icono + título + subtítulo + acción opcional.
// El contenedor y el círculo se ajustan con `style`/`iconoStyle`.
type Props = {
  icono: IconoNombre;
  titulo: string;
  subtitulo?: string;
  accion?: ReactNode;
  iconoSize?: number;
  circuloSize?: number;
  tituloSize?: number;
  style?: StyleProp<ViewStyle>;
  iconoStyle?: StyleProp<ViewStyle>;
  tituloStyle?: StyleProp<TextStyle>;
  subtituloStyle?: StyleProp<TextStyle>;
};

export function EmptyState({
  icono,
  titulo,
  subtitulo,
  accion,
  iconoSize = 30,
  circuloSize = 64,
  tituloSize = 17,
  style,
  iconoStyle,
  tituloStyle,
  subtituloStyle,
}: Props) {
  return (
    <View style={[styles.wrap, style]}>
      <View
        style={[
          styles.icono,
          { width: circuloSize, height: circuloSize, borderRadius: circuloSize / 2 },
          iconoStyle,
        ]}
      >
        <Ionicons name={icono} size={iconoSize} color={colors.primary} />
      </View>
      <Text style={[styles.titulo, { fontSize: tituloSize }, tituloStyle]}>
        {titulo}
      </Text>
      {subtitulo ? (
        <Text style={[styles.subtitulo, subtituloStyle]}>{subtitulo}</Text>
      ) : null}
      {accion}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 8 },
  icono: {
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: { color: colors.textPrimary, fontWeight: '800' },
  subtitulo: { color: colors.textMuted, fontSize: 14, textAlign: 'center' },
});
