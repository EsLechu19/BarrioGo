
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Camera, Map, Marker } from '@maplibre/maplibre-react-native';
import { useColors } from '../../context/ThemeContext';

type Props = {
  lat: number;
  lng: number;
  nombre: string;
};

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

export function MapaUbicacion({ lat, lng, nombre }: Props) {
  const colors = useColors();

  const valido =
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180;

  if (!valido) {
    return (
      <View style={styles.fallback}>
        <Ionicons
          name="warning-outline"
          size={28}
          color={colors.error}
        />
        <Text style={[styles.fallbackText, { color: colors.error }]}>
          Coordenadas no disponibles
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Map
        style={styles.map}
        mapStyle={MAP_STYLE}
        attribution
        compass={false}
        touchRotate={false}
        touchPitch={false}
      >
        <Camera
          initialViewState={{
            center: [lng, lat],
            zoom: 16,
          }}
        />
        <Marker
          lngLat={[lng, lat]}
          anchor="bottom"
        >
          <View style={styles.marker}>
            <Ionicons
              name="location"
              size={40}
              color={colors.primary}
            />
          </View>
        </Marker>
      </Map>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  marker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallback: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  fallbackText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
