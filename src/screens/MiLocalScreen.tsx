import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { firebaseReady, getFirestoreDb } from '../services/firebase';
import { actualizarNegocio } from '../services/api';
import { useNegocioId } from '../hooks/useNegocioId';
import { useUbicacionGps } from '../hooks/useUbicacionGps';
import { useFotoNegocio } from '../hooks/useFotoNegocio';
import { ScreenHeader } from '../components/ScreenHeader';
import { FormField } from '../components/FormField';
import { PrimaryButton } from '../components/PrimaryButton';
import { UbicacionInput } from '../components/UbicacionInput';
import { LoadingState } from '../components/StateView';
import { RootStackParamList } from '../navigation/RootStackParamList';
import { colors } from '../styles/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'MiLocal'>;

const GUIA_SIN_NEGOCIO =
  'Todavía no tienes un negocio vinculado. Regístralo desde tu perfil para editarlo aquí.';

export default function MiLocalScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const uid: string | undefined = user?.uid;

  // Mismo patrón que NegocioScreen: negocioId en users/{uid} + precarga
  // con getDoc del negocio.
  const {
    negocioId,
    loading: leyendoVinculo,
    error: vinculoError,
  } = useNegocioId();

  const [cargandoNegocio, setCargandoNegocio] = useState<boolean>(true);
  const [negocioError, setNegocioError] = useState<string | null>(null);

  const [nombre, setNombre] = useState<string>('');
  const [descripcion, setDescripcion] = useState<string>('');
  const [direccion, setDireccion] = useState<string>('');
  const [tiempoEstimado, setTiempoEstimado] = useState<string>('');
  const [envioGratis, setEnvioGratis] = useState<boolean>(false);
  const [latTxt, setLatTxt] = useState<string>('');
  const [lngTxt, setLngTxt] = useState<string>('');

  const {
    leyendo: leyendoGps,
    aviso: gpsAviso,
    usar: obtenerUbicacion,
  } = useUbicacionGps({
    mensajeSinUbicacion:
      'No pudimos obtener tu ubicación (permiso denegado o sin señal). Mantenemos la actual.',
    mensajeExito: 'Ubicación actualizada con tu GPS.',
    mensajeError: (e) =>
      e instanceof Error
        ? `No pudimos obtener tu ubicación: ${e.message}. Mantenemos la actual.`
        : 'No pudimos obtener tu ubicación. Mantenemos la actual.',
  });

  const [guardando, setGuardando] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formOk, setFormOk] = useState<string | null>(null);

  // S3 Fotos: icono (cuadrado) + portada (16:9) con subida a Cloudinary.
  const [iconoUrl, setIconoUrl] = useState<string>('');
  const [portadaUrl, setPortadaUrl] = useState<string>('');
  const {
    subiendo,
    error: fotoError,
    elegir: elegirFoto,
  } = useFotoNegocio({
    negocioId,
    uid,
    onSubida: (tipo, url) => {
      if (tipo === 'icono') setIconoUrl(url);
      else setPortadaUrl(url);
    },
  });

  useEffect(() => {
    if (leyendoVinculo) return;
    if (!negocioId) {
      setCargandoNegocio(false);
      return;
    }
    let activo = true;
    setCargandoNegocio(true);
    setNegocioError(null);
    (async () => {
      try {
        const negocioSnap = await getDoc(
          doc(getFirestoreDb(), 'negocios', negocioId),
        );
        if (!negocioSnap.exists()) {
          if (activo) setNegocioError('El negocio no existe.');
          return;
        }
        const negocio: unknown = negocioSnap.data();
        if (typeof negocio === 'object' && negocio !== null) {
          const n = negocio as {
            nombre?: unknown;
            descripcion?: unknown;
            direccion?: unknown;
            tiempoEstimado?: unknown;
            envioGratis?: unknown;
            lat?: unknown;
            lng?: unknown;
            imagen?: unknown;
            portada?: unknown;
          };
          if (typeof n.nombre === 'string') setNombre(n.nombre);
          if (typeof n.descripcion === 'string') setDescripcion(n.descripcion);
          if (typeof n.direccion === 'string') setDireccion(n.direccion);
          if (typeof n.tiempoEstimado === 'string')
            setTiempoEstimado(n.tiempoEstimado);
          if (typeof n.envioGratis === 'boolean')
            setEnvioGratis(n.envioGratis);
          if (typeof n.lat === 'number' && Number.isFinite(n.lat))
            setLatTxt(String(n.lat));
          if (typeof n.lng === 'number' && Number.isFinite(n.lng))
            setLngTxt(String(n.lng));
          if (typeof n.imagen === 'string') setIconoUrl(n.imagen);
          if (typeof n.portada === 'string') setPortadaUrl(n.portada);
        }
      } catch (e) {
        if (activo) {
          setNegocioError(
            e instanceof Error
              ? `No se pudo leer tu negocio: ${e.message}`
              : 'No se pudo leer tu negocio. Intentá de nuevo.',
          );
        }
      } finally {
        if (activo) setCargandoNegocio(false);
      }
    })();
    return () => {
      activo = false;
    };
  }, [negocioId, leyendoVinculo]);

  const cargando: boolean = leyendoVinculo || cargandoNegocio;
  const cargaError: string | null = vinculoError ?? negocioError;

  async function usarMiUbicacion(): Promise<void> {
    const coords = await obtenerUbicacion();
    if (coords) {
      setLatTxt(String(coords.latitude));
      setLngTxt(String(coords.longitude));
    }
  }

  async function guardar(): Promise<void> {
    if (guardando || !negocioId || !uid) return;
    setFormError(null);
    setFormOk(null);
    const nombreValido: string = nombre.trim();
    if (!nombreValido) {
      setFormError('El negocio necesita un nombre.');
      return;
    }
    const lat: number = Number(latTxt.replace(',', '.'));
    const lng: number = Number(lngTxt.replace(',', '.'));
    if (
      (latTxt.trim() && !Number.isFinite(lat)) ||
      (lngTxt.trim() && !Number.isFinite(lng))
    ) {
      setFormError('La ubicación no es válida (revisá latitud y longitud).');
      return;
    }
    setGuardando(true);
    try {
      await actualizarNegocio({
        negocioId,
        usuarioId: uid,
        nombre: nombreValido,
        descripcion: descripcion.trim(),
        direccion: direccion.trim(),
        tiempoEstimado: tiempoEstimado.trim(),
        envioGratis,
        lat: latTxt.trim() ? lat : undefined,
        lng: lngTxt.trim() ? lng : undefined,
      });
      setFormOk('Cambios guardados.');
    } catch (e) {
      setFormError(
        e instanceof Error
          ? e.message
          : 'No se pudo actualizar el negocio. Intentá de nuevo.',
      );
    } finally {
      setGuardando(false);
    }
  }

  if (!firebaseReady) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>Mi local</Text>
        <Text style={styles.subtitle}>
          Conectá Firebase (archivo .env) para editar tu negocio.
        </Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>Mi local</Text>
        <Text style={styles.subtitle}>Iniciá sesión para editar tu negocio.</Text>
      </View>
    );
  }

  if (cargando) {
    // Area loading
    return (
      <LoadingState
        mensaje="Leyendo tu negocio..."
        style={[styles.container, styles.center, { paddingTop: insets.top + 12 }]}
        textoStyle={styles.subtitle}
      />
    );
  }

  if (!negocioId) {
    // Area vacio
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>Mi local</Text>
        {cargaError ? <Text style={styles.error}>{cargaError}</Text> : null}
        <Text style={styles.subtitle}>{GUIA_SIN_NEGOCIO}</Text>
        <PrimaryButton
          title="Registrar mi negocio"
          onPress={() => navigation.navigate('RegistrarNegocio')}
        />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12 }]}>
      <ScrollView contentContainerStyle={styles.container}>
      {/* Area titulo */}
      <ScreenHeader
        titulo="Mi local"
        subtitulo="Editá la info que ven tus clientes en Detalle."
        onBack={() => navigation.goBack()}
        backAccessibilityLabel="Volver"
      />
      {cargaError ? <Text style={styles.error}>{cargaError}</Text> : null}
      {/* Area formulario */}
      <FormField
        placeholder="Nombre del negocio"
        value={nombre}
        onChangeText={setNombre}
      />
      <FormField
        placeholder="Descripción (opcional)"
        value={descripcion}
        onChangeText={setDescripcion}
      />
      <FormField
        placeholder="Dirección (opcional)"
        value={direccion}
        onChangeText={setDireccion}
      />
      <FormField
        placeholder="Tiempo estimado (ej. 20-30 min)"
        value={tiempoEstimado}
        onChangeText={setTiempoEstimado}
      />
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Envío gratis</Text>
        <TouchableOpacity
          style={[styles.toggleTrack, envioGratis && styles.toggleTrackOn]}
          onPress={() => setEnvioGratis(!envioGratis)}
          activeOpacity={0.8}
          accessibilityRole="switch"
          accessibilityState={{ checked: envioGratis }}
          accessibilityLabel="Envío gratis"
        >
          <View
            style={[
              styles.toggleThumb,
              envioGratis ? styles.toggleThumbOn : styles.toggleThumbOff,
            ]}
          >
            {envioGratis ? (
              <Ionicons name="checkmark" size={14} color={colors.primary} />
            ) : null}
          </View>
        </TouchableOpacity>
      </View>
      {/* Area ubicacion */}
      <UbicacionInput
        leyendo={leyendoGps}
        aviso={gpsAviso}
        onUsar={() => void usarMiUbicacion()}
        lat={latTxt}
        lng={lngTxt}
        onLatChange={setLatTxt}
        onLngChange={setLngTxt}
      />
      {formError ? <Text style={styles.error}>{formError}</Text> : null}
      {formOk ? <Text style={styles.ok}>{formOk}</Text> : null}
      {/* Area fotos */}
      <Text style={styles.sectionTitle}>Fotos</Text>
      {/* Fila foto */}
      <View style={styles.fotoRow}>
        {iconoUrl ? (
          <Image source={{ uri: iconoUrl }} style={styles.iconoPreview} />
        ) : (
          <View style={[styles.iconoPreview, styles.placeholder]}>
            <Text style={styles.placeholderText}>Sin icono</Text>
          </View>
        )}
        <View style={styles.fotoBotones}>
          <Text style={styles.fotoLabel}>Icono (cuadrado)</Text>
          <View style={styles.fotoAcciones}>
            <TouchableOpacity
              style={[styles.fotoButton, subiendo && styles.disabledButton]}
              disabled={subiendo !== null}
              onPress={() => void elegirFoto('icono', false)}
            >
              <Text style={styles.fotoButtonText}>
                {subiendo === 'icono' ? 'Subiendo...' : 'Galería'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.fotoButton, subiendo && styles.disabledButton]}
              disabled={subiendo !== null}
              onPress={() => void elegirFoto('icono', true)}
            >
              <Text style={styles.fotoButtonText}>Cámara</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      {/* Fila foto */}
      <View style={styles.fotoColumna}>
        {portadaUrl ? (
          <Image source={{ uri: portadaUrl }} style={styles.portadaPreview} />
        ) : (
          <View style={[styles.portadaPreview, styles.placeholder]}>
            <Text style={styles.placeholderText}>Sin portada</Text>
          </View>
        )}
        <Text style={styles.fotoLabel}>Portada (16:9)</Text>
        <View style={styles.fotoAcciones}>
          <TouchableOpacity
            style={[styles.fotoButton, subiendo && styles.disabledButton]}
            disabled={subiendo !== null}
            onPress={() => void elegirFoto('portada', false)}
          >
            <Text style={styles.fotoButtonText}>
              {subiendo === 'portada' ? 'Subiendo...' : 'Galería'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.fotoButton, subiendo && styles.disabledButton]}
            disabled={subiendo !== null}
            onPress={() => void elegirFoto('portada', true)}
          >
            <Text style={styles.fotoButtonText}>Cámara</Text>
          </TouchableOpacity>
        </View>
      </View>
      {subiendo ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : null}
      {fotoError ? <Text style={styles.error}>{fotoError}</Text> : null}
      {/* Area guardar */}
      <View style={{ marginBottom: insets.bottom + 40 }}>
        <PrimaryButton
          title={guardando ? 'Guardando...' : 'Guardar cambios'}
          onPress={() => void guardar()}
          disabled={guardando}
        />
      </View>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Base
  screen: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, gap: 12, padding: 16, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  subtitle: { color: colors.textMuted, fontSize: 14, textAlign: 'center' },
  error: { color: colors.error, fontSize: 14, fontWeight: '600' },
  ok: { color: colors.success, fontSize: 14, fontWeight: '600' },
  disabledButton: { opacity: 0.6 },

  // Area titulo
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: '900' },

  // Area formulario
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  switchLabel: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
  // Toggle (mismo estilo que Configuración)
  toggleTrack: {
    width: 54,
    height: 32,
    borderRadius: 16,
    padding: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: colors.border,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleTrackOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  toggleThumbOn: { marginLeft: 22 },
  toggleThumbOff: { marginLeft: 0 },

  // Area fotos
  sectionTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '800' },
  // Fila foto
  fotoRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  iconoPreview: { width: 72, height: 72, borderRadius: 14 },
  fotoBotones: { flex: 1, gap: 8 },
  fotoLabel: { color: colors.textPrimary, fontSize: 14, fontWeight: '700' },
  fotoAcciones: { flexDirection: 'row', gap: 8 },
  fotoButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  fotoButtonText: { color: colors.primary, fontSize: 14, fontWeight: '700' },
  // Fila foto
  fotoColumna: { gap: 8 },
  portadaPreview: { width: '100%', height: 140, borderRadius: 14 },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  placeholderText: { color: colors.textMuted, fontSize: 13 },
});
