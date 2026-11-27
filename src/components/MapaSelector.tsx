import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Camera, Map, Marker } from '@maplibre/maplibre-react-native';
import { getUserCoords } from '../services/location';
import { geocodificarDireccion, reverseGeocodificarCoordenadas } from '../services/geocoding';
import { useColors } from '../context/ThemeContext';
import type { Colors } from '../styles/colors';

export type CoordenadasMapa = {
  lat: number;
  lng: number;
};

type Props = {
  visible: boolean;
  initial?: CoordenadasMapa | null;
  initialAddress?: string;
  onClose: () => void;
  onConfirm: (coordenadas: CoordenadasMapa, address: string | null) => void;
};

const LIMA_INICIAL: CoordenadasMapa = { lat: -12.0464, lng: -77.0428 };
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

function esCoordenadaValida(value: CoordenadasMapa | null | undefined): value is CoordenadasMapa {
  return (
    value !== null &&
    value !== undefined &&
    Number.isFinite(value.lat) &&
    Number.isFinite(value.lng) &&
    value.lat >= -90 &&
    value.lat <= 90 &&
    value.lng >= -180 &&
    value.lng <= 180
  );
}

export function MapaSelector({ visible, initial, initialAddress, onClose, onConfirm }: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const address = initialAddress?.trim() ?? '';
  const [seleccion, setSeleccion] = useState<CoordenadasMapa>(
    esCoordenadaValida(initial) ? initial : LIMA_INICIAL,
  );
  const [leyendoGps, setLeyendoGps] = useState<boolean>(false);
  const [confirmando, setConfirmando] = useState<boolean>(false);
  const [estadoBusqueda, setEstadoBusqueda] = useState<'idle' | 'loading' | 'resolved' | 'unresolved'>(
    visible && address ? 'loading' : 'idle',
  );
  const [aviso, setAviso] = useState<string | null>(null);
  const [seleccionManual, setSeleccionManual] = useState<boolean>(false);
  const selectionChanged = useRef<boolean>(false);
  const lookupPending = useRef<boolean>(false);
  const requiereSeleccionManual = estadoBusqueda === 'unresolved' && !seleccionManual;

  useEffect(() => {
    if (!visible || !address) return;
    let active = true;
    lookupPending.current = true;
    void geocodificarDireccion(address).then((coordinates) => {
      if (!active) return;
      lookupPending.current = false;
      setEstadoBusqueda(coordinates ? 'resolved' : 'unresolved');
      if (coordinates && !selectionChanged.current) setSeleccion(coordinates);
    }).catch(() => {
      if (!active) return;
      lookupPending.current = false;
      setEstadoBusqueda('unresolved');
    });
    return () => {
      active = false;
      lookupPending.current = false;
    };
  }, [address, visible]);

  const confirmar = async (): Promise<void> => {
    if (confirmando || lookupPending.current || requiereSeleccionManual) return;
    setConfirmando(true);
    let resolvedAddress: string | null = null;
    try {
      resolvedAddress = await reverseGeocodificarCoordenadas(seleccion);
    } catch {
      resolvedAddress = null;
    }
    onConfirm(seleccion, resolvedAddress);
  };

  const usarMiUbicacion = useCallback(async (): Promise<void> => {
    setLeyendoGps(true);
    setAviso(null);
    try {
      const coords = await getUserCoords();
      if (!coords) {
        setAviso('No pudimos obtener tu ubicación. Elegí el punto manualmente.');
        return;
      }
      selectionChanged.current = true;
      setSeleccionManual(true);
      setSeleccion({ lat: coords.latitude, lng: coords.longitude });
    } catch {
      setAviso('No pudimos obtener tu ubicación. Elegí el punto manualmente.');
    } finally {
      setLeyendoGps(false);
    }
  }, []);

  const cerrar = (): void => {
    setAviso(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={cerrar}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Elegir ubicación</Text>
            <Text style={styles.subtitle}>Tocá el mapa para colocar el pin.</Text>
          </View>
          <TouchableOpacity
            onPress={cerrar}
            accessibilityRole="button"
            accessibilityLabel="Cerrar mapa"
            hitSlop={8}
          >
            <Ionicons name="close" size={26} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.mapContainer}>
          <Map
            style={styles.map}
            mapStyle={MAP_STYLE}
            attribution
            compass={false}
            touchRotate={false}
            touchPitch={false}
            onPress={(event) => {
              const [lng, lat] = event.nativeEvent.lngLat;
              selectionChanged.current = true;
              setSeleccionManual(true);
              setSeleccion({ lat, lng });
            }}
          >
            <Camera
              key={`${seleccion.lat}-${seleccion.lng}`}
              initialViewState={{ center: [seleccion.lng, seleccion.lat], zoom: 16 }}
            />
            <Marker lngLat={[seleccion.lng, seleccion.lat]} anchor="bottom">
              <Ionicons name="location" size={42} color={colors.primary} />
            </Marker>
          </Map>
        </View>

        <Text style={styles.attribution}>Geocodificación © OpenStreetMap contributors</Text>
        {aviso ? <Text style={styles.notice}>{aviso}</Text> : null}
        {requiereSeleccionManual ? (
          <Text style={styles.notice}>No encontramos esa dirección. Elegí un punto en el mapa o usá tu ubicación para continuar.</Text>
        ) : null}
        <TouchableOpacity
          style={[styles.secondaryButton, leyendoGps && styles.disabled]}
          onPress={() => void usarMiUbicacion()}
          disabled={leyendoGps}
          accessibilityRole="button"
        >
          {leyendoGps ? <ActivityIndicator color={colors.primary} /> : <Ionicons name="locate-outline" size={20} color={colors.primary} />}
          <Text style={styles.secondaryText}>{leyendoGps ? 'Buscando ubicación...' : 'Usar mi ubicación'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.confirmButton, (confirmando || estadoBusqueda === 'loading' || requiereSeleccionManual) && styles.disabled]}
          onPress={() => void confirmar()}
          disabled={confirmando || estadoBusqueda === 'loading' || requiereSeleccionManual}
          accessibilityRole="button"
        >
          {confirmando ? <ActivityIndicator color={colors.white} /> : <Text style={styles.confirmText}>Confirmar ubicación</Text>}
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

function makeStyles(c: Colors) {
  return StyleSheet.create({
    screen: { flex: 1, gap: 14, padding: 20, paddingTop: 52, backgroundColor: c.background },
    header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
    headerText: { flex: 1, gap: 3 },
    title: { color: c.textPrimary, fontSize: 20, fontWeight: '900' },
    subtitle: { color: c.textMuted, fontSize: 14 },
    mapContainer: { flex: 1, minHeight: 250, overflow: 'hidden', borderRadius: 16, backgroundColor: c.border },
    map: { width: '100%', height: '100%' },
    notice: { color: c.textMuted, fontSize: 13, textAlign: 'center' },
    attribution: { color: c.textMuted, fontSize: 10, textAlign: 'center' },
    secondaryButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, paddingVertical: 13, borderRadius: 14, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface },
    secondaryText: { color: c.primary, fontSize: 15, fontWeight: '800' },
    confirmButton: { paddingVertical: 15, borderRadius: 14, alignItems: 'center', backgroundColor: c.primary },
    confirmText: { color: c.white, fontSize: 16, fontWeight: '800' },
    disabled: { opacity: 0.6 },
  });
}
