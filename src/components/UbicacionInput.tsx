import { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useColors } from '../context/ThemeContext';
import type { Colors } from '../styles/colors';

// Bloque de ubicación: botón GPS + aviso + inputs de latitud/longitud.
// Props controladas: la pantalla decide qué hacer con las coordenadas.
type Props = {
  leyendo: boolean;
  aviso: string | null;
  onUsar: () => void;
  onElegirMapa: () => void;
  tieneUbicacion: boolean;
};

export function UbicacionInput({
  leyendo,
  aviso,
  onUsar,
  onElegirMapa,
  tieneUbicacion,
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
      <TouchableOpacity style={styles.mapButton} onPress={onElegirMapa}>
        <Text style={styles.mapText}>Elegir ubicación en mapa</Text>
      </TouchableOpacity>
      <Text style={styles.status}>
        {tieneUbicacion ? 'Ubicación seleccionada.' : 'Elegí tu ubicación con GPS o en el mapa.'}
      </Text>
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
    mapButton: { paddingVertical: 12, borderRadius: 14, alignItems: 'center', backgroundColor: c.primarySoft },
    mapText: { color: c.primary, fontSize: 15, fontWeight: '800' },
    status: { color: c.textMuted, fontSize: 13, textAlign: 'center' },
  });
}
