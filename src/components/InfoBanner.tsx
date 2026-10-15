import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../context/ThemeContext';
import type { Colors } from '../styles/colors';

// Banner informativo suave (fondo primarySoft + icono info + texto).
type Props = {
  texto: string;
  style?: StyleProp<ViewStyle>;
  textoStyle?: StyleProp<TextStyle>;
};

export function InfoBanner({ texto, style, textoStyle }: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
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

function makeStyles(c: Colors) {
  return StyleSheet.create({
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: 12,
      borderRadius: 14,
      backgroundColor: c.primarySoft,
    },
    texto: { flex: 1, color: c.textSecondary, fontSize: 13 },
  });
}
