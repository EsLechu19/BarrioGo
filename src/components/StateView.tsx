import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import type { ReactNode } from 'react';
import { colors } from '../styles/colors';

// Estado de carga centralizado. El contenedor (paddingTop con insets, etc.)
// lo aporta cada pantalla vía `style`, así no cambia ningún espaciado.
type LoadingProps = {
  mensaje: string;
  style?: StyleProp<ViewStyle>;
  textoStyle?: StyleProp<TextStyle>;
};

export function LoadingState({ mensaje, style, textoStyle }: LoadingProps) {
  return (
    <View style={[styles.center, style]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.texto, textoStyle]}>{mensaje}</Text>
    </View>
  );
}

// Estado de error: mensaje + acción opcional (Reintentar / Volver).
type ErrorProps = {
  mensaje: string;
  accion?: ReactNode;
  style?: StyleProp<ViewStyle>;
  textoStyle?: StyleProp<TextStyle>;
};

export function ErrorState({ mensaje, accion, style, textoStyle }: ErrorProps) {
  return (
    <View style={[styles.center, style]}>
      <Text style={[styles.texto, textoStyle]}>{mensaje}</Text>
      {accion}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { justifyContent: 'center', alignItems: 'center' },
  texto: { color: colors.textMuted, fontSize: 14, textAlign: 'center' },
});
