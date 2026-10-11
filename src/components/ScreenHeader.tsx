import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import type { ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/colors';

// Encabezado reutilizable con botón "volver" circular + título/subtítulo y
// un espacio opcional a la derecha (badge, botón "Añadir", etc.).
type Props = {
  titulo: string;
  subtitulo?: string;
  onBack?: () => void;
  right?: ReactNode;
  backSize?: number;
  backAccessibilityLabel?: string;
  tituloSize?: number;
  tituloNumberOfLines?: number;
  style?: StyleProp<ViewStyle>;
};

export function ScreenHeader({
  titulo,
  subtitulo,
  onBack,
  right,
  backSize = 42,
  backAccessibilityLabel = 'Volver',
  tituloSize = 22,
  tituloNumberOfLines,
  style,
}: Props) {
  const radio: number = backSize / 2;
  return (
    <View style={[styles.header, style]}>
      {onBack ? (
        <TouchableOpacity
          style={[
            styles.backButton,
            { width: backSize, height: backSize, borderRadius: radio },
          ]}
          onPress={onBack}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={backAccessibilityLabel}
        >
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      ) : null}
      <View style={styles.textBlock}>
        <Text
          style={[styles.titulo, { fontSize: tituloSize }]}
          numberOfLines={tituloNumberOfLines}
        >
          {titulo}
        </Text>
        {subtitulo?.trim() ? (
          <Text style={styles.subtitulo} numberOfLines={1}>
            {subtitulo}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textBlock: { flex: 1, gap: 2 },
  titulo: { color: colors.textPrimary, fontWeight: '900' },
  subtitulo: { color: colors.textMuted, fontSize: 13 },
});
