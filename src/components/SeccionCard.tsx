import { useMemo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import type { ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../context/ThemeContext';
import type { Colors } from '../styles/colors';

// Card única del panel negocio (modelo Locales): mismos valores de tamaño en
// todas las filas de todas las secciones (Pedidos, Mi menú, Repartidores,
// Locales). Thumb 56 + título + subtítulo + badge + fila inferior opcional.
export type IconoCard =
  | 'storefront-outline'
  | 'fast-food-outline'
  | 'time-outline'
  | 'checkmark-circle-outline'
   | 'bicycle-outline'
  | 'checkmark-done-outline'
  | 'close-circle-outline';

type Props = {
  titulo: string;
  subtitulo?: string;
  foto?: string;
  icono: IconoCard;
  iconoFondo?: string;
  iconoColor?: string;
  inicial?: string;
  badgeTexto?: string;
  badgeColor?: string;
  atenuada?: boolean;
  children?: ReactNode;
  accionInferior?: ReactNode;
};

export function SeccionCard({
  titulo,
  subtitulo,
  foto,
  icono,
  iconoFondo,
  iconoColor,
  inicial,
  badgeTexto,
  badgeColor,
  atenuada,
  children,
  accionInferior,
}: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const fondo: string = iconoFondo ?? colors.primarySoft;
  const tinta: string = iconoColor ?? colors.primary;
  return (
    <View style={[styles.card, atenuada && styles.atenuada]}>
      <View style={styles.top}>
        {foto?.trim() ? (
          <Image source={{ uri: foto }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder, { backgroundColor: fondo }]}>
            {inicial?.trim() ? (
              <Text style={[styles.inicial, { color: tinta }]}>{inicial}</Text>
            ) : (
              <Ionicons name={icono} size={26} color={tinta} />
            )}
          </View>
        )}
        <View style={styles.info}>
          <Text style={styles.titulo} numberOfLines={1}>
            {titulo}
          </Text>
          {subtitulo?.trim() ? (
            <Text style={styles.subtitulo} numberOfLines={1}>
              {subtitulo}
            </Text>
          ) : null}
        </View>
        {badgeTexto?.trim() ? (
          <View style={[styles.badge, { backgroundColor: badgeColor ?? colors.primary }]}>
            <Text style={styles.badgeText}>{badgeTexto}</Text>
          </View>
        ) : null}
      </View>
      {children}
      {accionInferior}
    </View>
  );
}

function makeStyles(c: Colors) {
  return StyleSheet.create({
    card: {
      gap: 10,
      padding: 14,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      backgroundColor: c.surface,
    },
    atenuada: { opacity: 0.6 },
    top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    thumb: { width: 56, height: 56, borderRadius: 14, backgroundColor: c.border },
    thumbPlaceholder: {
      borderWidth: 1,
      borderColor: c.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    inicial: { fontSize: 20, fontWeight: '800' },
    info: { flex: 1, gap: 2 },
    titulo: { color: c.textPrimary, fontSize: 15, fontWeight: '700' },
    subtitulo: { color: c.textMuted, fontSize: 13 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
    badgeText: { color: c.white, fontSize: 12, fontWeight: '700' },
  });
}
