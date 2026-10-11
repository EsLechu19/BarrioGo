import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Negocio } from '../../types/Negocio';
import { colors } from '../../styles/colors';

// Pestaña Información: descripción, ubicación (placeholder de mapa) y entrega.
type Props = {
  negocio: Negocio;
};

export function InfoTab({ negocio }: Props) {
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
      {/* Card ubicacion + mapa (placeholder) */}
      <View style={styles.infoCard}>
        <View style={styles.infoHeader}>
          <View style={styles.infoIcon}>
            <Ionicons name="location-outline" size={18} color={colors.primary} />
          </View>
          <Text style={styles.infoTitle}>Ubicación</Text>
        </View>
        {/* Placeholder cuadrado: aquí va el mapa (react-native-maps, Fase 3) */}
        <View style={styles.mapPlaceholder}>
          <Ionicons name="map-outline" size={32} color={colors.textPlaceholder} />
          <Text style={styles.mapPlaceholderText}>Aquí va el mapa</Text>
          <Text style={styles.infoSub}>
            {Number.isFinite(negocio.lat) && Number.isFinite(negocio.lng)
              ? `${negocio.lat.toFixed(4)}, ${negocio.lng.toFixed(4)}`
              : 'Sin coordenadas'}
          </Text>
        </View>
        {/* Detalle direccion */}
        <View style={styles.infoRowLine}>
          <Ionicons name="home-outline" size={16} color={colors.textMuted} />
          <Text style={styles.meta}>
            {negocio.direccion?.trim() ? negocio.direccion : 'Dirección por confirmar'}
          </Text>
        </View>
        <View style={styles.infoRowLine}>
          <Ionicons name="navigate-outline" size={16} color={colors.textMuted} />
          <Text style={styles.meta}>{negocio.distancia} de ti</Text>
        </View>
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
            {negocio.envioGratis
              ? 'Envío gratis'
              : negocio.envioMinimo?.trim()
                ? negocio.envioMinimo
                : 'Costo de envío por confirmar'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tabContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 20, gap: 12 },
  infoCard: {
    gap: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  infoHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
  },
  infoTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '800' },
  infoDesc: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
  infoSub: { color: colors.textMuted, fontSize: 12.5 },
  infoRowLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mapPlaceholder: {
    height: 160,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
  mapPlaceholderText: { color: colors.textMuted, fontSize: 14, fontWeight: '700' },
  meta: { color: colors.textMuted, fontSize: 13 },
});