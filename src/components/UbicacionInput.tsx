import { useMemo } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useColors } from '../context/ThemeContext';
import type { Colors } from '../styles/colors';

// Bloque de ubicación: botón GPS + aviso + inputs de latitud/longitud.
// Props controladas: la pantalla decide qué hacer con las coordenadas.
type Props = {
  leyendo: boolean;
  aviso: string | null;
  onUsar: () => void;
  lat: string;
  lng: string;
  onLatChange: (valor: string) => void;
  onLngChange: (valor: string) => void;
};

export function UbicacionInput({
  leyendo,
  aviso,
  onUsar,
  lat,
  lng,
  onLatChange,
  onLngChange,
}: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <>
      <TouchableOpacity
        style={[styles.gpsButton, leyendo && styles.disabled]}
        disabled={leyendo}
        onPress={onUsar}
      >
        <Text style={styles.gpsText}>
          {leyendo ? 'Leyendo GPS...' : 'Usar mi ubicación'}
        </Text>
      </TouchableOpacity>
      {aviso ? <Text style={styles.subtitle}>{aviso}</Text> : null}
      <View style={styles.coordsRow}>
        <TextInput
          style={[styles.input, styles.coordInput]}
          placeholder="Latitud"
          value={lat}
          onChangeText={onLatChange}
          keyboardType="decimal-pad"
        />
        <TextInput
          style={[styles.input, styles.coordInput]}
          placeholder="Longitud"
          value={lng}
          onChangeText={onLngChange}
          keyboardType="decimal-pad"
        />
      </View>
    </>
  );
}

function makeStyles(c: Colors) {
  return StyleSheet.create({
    gpsButton: {
      paddingVertical: 12,
      borderRadius: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    gpsText: { color: c.primary, fontSize: 15, fontWeight: '700' },
    disabled: { opacity: 0.6 },
    subtitle: { color: c.textMuted, fontSize: 14, textAlign: 'center' },
    coordsRow: { flexDirection: 'row', gap: 8 },
    coordInput: { flex: 1 },
    input: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 15,
      color: c.textPrimary,
      backgroundColor: c.surface,
    },
  });
}