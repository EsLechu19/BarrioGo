import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Negocio } from '../../types/Negocio';
import { textoEnvio } from '../../utils/negocios';
import { useColors } from '../../context/ThemeContext';
import type { Colors } from '../../styles/colors';
import { MapaUbicacion } from './MapaUbicacion';

// Pestaña Información: descripción, ubicación (con mapa estático de OSM) y
// entrega.
type Props = {
  negocio: Negocio;
  distanciaReal?: string;
};

export function InfoTab({ negocio, distanciaReal }: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      {/* Card descripcion */}
      {negocio.descripcion?.trim() ? (
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <View style={styles.infoIcon}>
              <Ionicons name="document-text-outline" size={18} color={colors.primary} />
            </View>
            <Text style={styles.infoTitle}>Acerca del restaurante</Text>
          </View>
          <Text style={styles.infoDesc}>{negocio.descripcion}</Text>
        </View>
      ) : null}
      {/* Card ubicacion */}
      <View style={styles.infoCard}>
        <View style={styles.infoHeader}>
          <View style={styles.infoIcon}>
            <Ionicons name="location-outline" size={18} color={colors.primary} />
          </View>
          <Text style={styles.infoTitle}>Ubicación</Text>
        </View>
        <MapaUbicacion
          key={`${negocio.lat}-${negocio.lng}`}
          lat={negocio.lat}
          lng={negocio.lng}
          nombre={negocio.nombre}
        />
        {/* Detalle direccion */}
        <View style={styles.infoRowLine}>
          <Ionicons name="home-outline" size={16} color={colors.textMuted} />
          <Text style={styles.meta}>
            {negocio.direccion?.trim() ? negocio.direccion : 'Dirección por confirmar'}
          </Text>
        </View>
        {distanciaReal ? (
          <View style={styles.infoRowLine}>
            <Ionicons name="navigate-outline" size={16} color={colors.textMuted} />
            <Text style={styles.meta}>{distanciaReal} de ti</Text>
          </View>
        ) : null}
      </View>
      {/* Card horario / delivery */}
      <View style={styles.infoCard}>
        <View style={styles.infoHeader}>
          <View style={styles.infoIcon}>
            <Ionicons name="time-outline" size={18} color={colors.primary} />
          </View>
          <Text style={styles.infoTitle}>Entrega</Text>
        </View>
        <View style={styles.infoRowLine}>
          <Ionicons name="bicycle-outline" size={16} color={colors.textMuted} />
          <Text style={styles.meta}>{negocio.tiempoEstimado || 'Tiempo por confirmar'}</Text>
        </View>
        <View style={styles.infoRowLine}>
          <Ionicons name="cube-outline" size={16} color={colors.textMuted} />
          <Text style={styles.meta}>
            {textoEnvio(negocio) ?? 'Costo de envío por confirmar'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

function makeStyles(c: Colors) {
  return StyleSheet.create({
    tabContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 20, gap: 12 },
    infoCard: {
      gap: 8,
      padding: 14,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      backgroundColor: c.surface,
    },
    infoHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    infoIcon: {
      width: 34,
      height: 34,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: c.primarySoft,
    },
    infoTitle: { color: c.textPrimary, fontSize: 15, fontWeight: '800' },
    infoDesc: { color: c.textSecondary, fontSize: 14, lineHeight: 20 },
    infoRowLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    meta: { color: c.textMuted, fontSize: 13 },
  });
}
