import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { firebaseReady, getFirestoreDb } from '../services/firebase';
import { actualizarNegocio, subirFotoNegocio, TipoFotoNegocio } from '../services/api';
import { getUserCoords } from '../services/location';
import { RootStackParamList } from '../navigation/RootStackParamList';
import { colors } from '../styles/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'MiLocal'>;

const GUIA_SIN_NEGOCIO =
  'Todavía no tenés un negocio vinculado. Registralo desde tu perfil para editarlo acá.';

export default function MiLocalScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const uid: string | undefined = user?.uid;

  const [negocioId, setNegocioId] = useState<string | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);
  const [cargaError, setCargaError] = useState<string | null>(null);

  const [nombre, setNombre] = useState<string>('');
  const [descripcion, setDescripcion] = useState<string>('');
  const [direccion, setDireccion] = useState<string>('');
  const [tiempoEstimado, setTiempoEstimado] = useState<string>('');
  const [envioGratis, setEnvioGratis] = useState<boolean>(false);
  const [latTxt, setLatTxt] = useState<string>('');
  const [lngTxt, setLngTxt] = useState<string>('');

  const [gpsAviso, setGpsAviso] = useState<string | null>(null);
  const [leyendoGps, setLeyendoGps] = useState<boolean>(false);

  const [guardando, setGuardando] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formOk, setFormOk] = useState<string | null>(null);

  // S3 Fotos: icono (cuadrado) + portada (16:9) con Firebase Storage.
  const [iconoUrl, setIconoUrl] = useState<string>('');
  const [portadaUrl, setPortadaUrl] = useState<string>('');
  const [subiendo, setSubiendo] = useState<TipoFotoNegocio | null>(null);
  const [fotoError, setFotoError] = useState<string | null>(null);

  // Mismo patrón que NegocioScreen: negocioId en users/{uid} + precarga
  // con getDoc del negocio.
  useEffect(() => {
    async function precargar(): Promise<void> {
      if (!firebaseReady || !uid) {
        setCargando(false);
        return;
      }
      setCargando(true);
      setCargaError(null);
      try {
        const userSnap = await getDoc(doc(getFirestoreDb(), 'users', uid));
        const userData: unknown = userSnap.exists() ? userSnap.data() : null;
        const id: unknown =
          typeof userData === 'object' && userData !== null
            ? (userData as { negocioId?: unknown }).negocioId
            : undefined;
        if (typeof id !== 'string' || !id.trim()) {
          setNegocioId(null);
          return;
        }
        setNegocioId(id);
        const negocioSnap = await getDoc(
          doc(getFirestoreDb(), 'negocios', id),
        );
        if (!negocioSnap.exists()) {
          setCargaError('El negocio no existe.');
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
        setCargaError(
          e instanceof Error
            ? `No se pudo leer tu negocio: ${e.message}`
            : 'No se pudo leer tu negocio. Intentá de nuevo.',
        );
        setNegocioId(null);
      } finally {
        setCargando(false);
      }
    }
    void precargar();
  }, [uid]);

  async function usarMiUbicacion(): Promise<void> {
    if (leyendoGps) return;
    setLeyendoGps(true);
    setGpsAviso(null);
    try {
      const coords = await getUserCoords();
      if (!coords) {
        setGpsAviso(
          'No pudimos obtener tu ubicación (permiso denegado o sin señal). Mantenemos la actual.',
        );
      } else {
        setLatTxt(String(coords.latitude));
        setLngTxt(String(coords.longitude));
        setGpsAviso('Ubicación actualizada con tu GPS.');
      }
    } catch (e) {
      setGpsAviso(
        e instanceof Error
          ? `No pudimos obtener tu ubicación: ${e.message}. Mantenemos la actual.`
          : 'No pudimos obtener tu ubicación. Mantenemos la actual.',
      );
    } finally {
      setLeyendoGps(false);
    }
  }

  async function elegirFoto(
    tipo: TipoFotoNegocio,
    desdeCamara: boolean,
  ): Promise<void> {
    if (subiendo || !negocioId || !uid) return;
    setFotoError(null);
    try {
      // Icono cuadrado, portada 16:9 (el aspect solo aplica en Android; en
      // iOS el recorte siempre es cuadrado — docs SDK 57).
      const aspect: [number, number] =
        tipo === 'icono' ? [1, 1] : [16, 9];
      if (desdeCamara) {
        const permiso = await ImagePicker.requestCameraPermissionsAsync();
        if (!permiso.granted) {
          setFotoError('Necesitamos permiso de cámara para tomar la foto.');
          return;
        }
        const resultado = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect,
          quality: 0.7,
        });
        if (resultado.canceled) return;
        const asset = resultado.assets[0];
        if (!asset) return;
        await subirElegida(tipo, asset.uri);
        return;
      }
      // Galería: no hace falta pedir permiso antes (docs SDK 57).
      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect,
        quality: 0.7,
      });
      // El usuario canceló → no hace nada, nunca crashea.
      if (resultado.canceled) return;
      const asset = resultado.assets[0];
      if (!asset) return;
      await subirElegida(tipo, asset.uri);
    } catch (e) {
      setFotoError(
        e instanceof Error
          ? e.message
          : 'No se pudo elegir la foto. Intentá de nuevo.',
      );
    }
  }

  async function subirElegida(
    tipo: TipoFotoNegocio,
    uriLocal: string,
  ): Promise<void> {
    if (!negocioId || !uid) return;
    setSubiendo(tipo);
    try {
      const url = await subirFotoNegocio(negocioId, uid, uriLocal, tipo);
      if (tipo === 'icono') setIconoUrl(url);
      else setPortadaUrl(url);
    } catch (e) {
      setFotoError(
        e instanceof Error
          ? e.message
          : 'No se pudo subir la foto. Intentá de nuevo.',
      );
    } finally {
      setSubiendo(null);
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
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top + 12 }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.subtitle}>Leyendo tu negocio...</Text>
      </View>
    );
  }

  if (!negocioId) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>Mi local</Text>
        {cargaError ? <Text style={styles.error}>{cargaError}</Text> : null}
        <Text style={styles.subtitle}>{GUIA_SIN_NEGOCIO}</Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('RegistrarNegocio')}
        >
          <Text style={styles.primaryText}>Registrar mi negocio</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ paddingTop: insets.top + 12 }}
      contentContainerStyle={styles.container}
    >
      <Text style={styles.title}>Mi local</Text>
      <Text style={styles.subtitle}>
        Editá la info que ven tus clientes en Detalle.
      </Text>
      {cargaError ? <Text style={styles.error}>{cargaError}</Text> : null}
      <TextInput
        style={styles.input}
        placeholder="Nombre del negocio"
        value={nombre}
        onChangeText={setNombre}
      />
      <TextInput
        style={styles.input}
        placeholder="Descripción (opcional)"
        value={descripcion}
        onChangeText={setDescripcion}
      />
      <TextInput
        style={styles.input}
        placeholder="Dirección (opcional)"
        value={direccion}
        onChangeText={setDireccion}
      />
      <TextInput
        style={styles.input}
        placeholder="Tiempo estimado (ej. 20-30 min)"
        value={tiempoEstimado}
        onChangeText={setTiempoEstimado}
      />
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Envío gratis</Text>
        <Switch value={envioGratis} onValueChange={setEnvioGratis} />
      </View>
      <TouchableOpacity
        style={[styles.gpsButton, leyendoGps && styles.disabledButton]}
        disabled={leyendoGps}
        onPress={() => void usarMiUbicacion()}
      >
        <Text style={styles.gpsText}>
          {leyendoGps ? 'Leyendo GPS...' : 'Usar mi ubicación'}
        </Text>
      </TouchableOpacity>
      {gpsAviso ? <Text style={styles.subtitle}>{gpsAviso}</Text> : null}
      <View style={styles.coordsRow}>
        <TextInput
          style={[styles.input, styles.coordInput]}
          placeholder="Latitud"
          value={latTxt}
          onChangeText={setLatTxt}
          keyboardType="decimal-pad"
        />
        <TextInput
          style={[styles.input, styles.coordInput]}
          placeholder="Longitud"
          value={lngTxt}
          onChangeText={setLngTxt}
          keyboardType="decimal-pad"
        />
      </View>
      {formError ? <Text style={styles.error}>{formError}</Text> : null}
      {formOk ? <Text style={styles.ok}>{formOk}</Text> : null}
      <Text style={styles.sectionTitle}>Fotos</Text>
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
      <TouchableOpacity
        style={[styles.primaryButton, guardando && styles.disabledButton]}
        disabled={guardando}
        onPress={() => void guardar()}
      >
        <Text style={styles.primaryText}>
          {guardando ? 'Guardando...' : 'Guardar cambios'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, gap: 12, padding: 16, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: '900' },
  subtitle: { color: colors.textMuted, fontSize: 14, textAlign: 'center' },
  error: { color: colors.error, fontSize: 14, fontWeight: '600' },
  ok: { color: colors.success, fontSize: 14, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
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
  coordsRow: { flexDirection: 'row', gap: 8 },
  coordInput: { flex: 1 },
  gpsButton: {
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  gpsText: { color: colors.primary, fontSize: 15, fontWeight: '700' },
  sectionTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '800' },
  primaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  primaryText: { color: colors.surface, fontSize: 15, fontWeight: '700' },
  disabledButton: { opacity: 0.6 },
  fotoRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  fotoColumna: { gap: 8 },
  iconoPreview: { width: 72, height: 72, borderRadius: 14 },
  portadaPreview: { width: '100%', height: 140, borderRadius: 14 },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  placeholderText: { color: colors.textMuted, fontSize: 13 },
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
});
