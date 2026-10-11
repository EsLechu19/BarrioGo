import { StyleSheet, Text, View } from 'react-native';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/colors';

// Banner informativo suave (fondo primarySoft + icono info + texto).
type Props = {
  texto: string;
  style?: StyleProp<ViewStyle>;
  textoStyle?: StyleProp<TextStyle>;
};

export function InfoBanner({ texto, style, textoStyle }: Props) {
  return (
    <View style={[styles.banner, style]}>
      <Ionicons
        name="information-circle-outline"
        size={18}
        color={colors.primary}
      />
      <Text style={[styles.texto, textoStyle]}>{texto}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
  },
  texto: { flex: 1, color: colors.textSecondary, fontSize: 13 },
});
