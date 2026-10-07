import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { firebaseReady, getFirestoreDb } from '../services/firebase';
import { registrarNegocio } from '../services/api';
import { getUserCoords } from '../services/location';
import { RootStackParamList } from '../navigation/RootStackParamList';
import { colors } from '../styles/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'RegistrarNegocio'>;

// GPS denegado o sin hardware: el registro sigue con Lima por defecto
// (editable en S2). Nunca crashea.
const DEFAULT_LAT = -12.0464;
const DEFAULT_LNG = -77.0428;

export default function RegistrarNegocioScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user, refreshRol } = useAuth();
  const uid: string | undefined = user?.uid;

  const [negocioId, setNegocioId] = useState<string | null>(null);
  const [leyendoVinculo, setLeyendoVinculo] = useState<boolean>(true);
  const [vinculoError, setVinculoError] = useState<string | null>(null);

  const [nombre, setNombre] = useState<string>('');
  const [descripcion, setDescripcion] = useState<string>('');
  const [direccion, setDireccion] = useState<string>('');
  const [latTxt, setLatTxt] = useState<string>(String(DEFAULT_LAT));
  const [lngTxt, setLngTxt] = useState<string>(String(DEFAULT_LNG));
  const [gpsAviso, setGpsAviso] = useState<string | null>(null);
  const [leyendoGps, setLeyendoGps] = useState<boolean>(false);

  const [guardando, setGuardando] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formOk, setFormOk] = useState<string | null>(null);

  // Un negocio por cuenta: si users/{uid} ya tiene negocioId, el form se bloquea.
  useEffect(() => {
    async function leerVinculo(): Promise<void> {
      if (!firebaseReady || !uid) {
        setLeyendoVinculo(false);
        return;
      }
      setLeyendoVinculo(true);
      setVinculoError(null);
      try {
        const snap = await getDoc(doc(getFirestoreDb(), 'users', uid));
        const data: unknown = snap.exists() ? snap.data() : null;
        const id: unknown =
          typeof data === 'object' && data !== null
            ? (data as { negocioId?: unknown }).negocioId
            : undefined;
        setNegocioId(typeof id === 'string' && id.trim() ? id : null);
      } catch (e) {
        setVinculoError(
          e instanceof Error
            ? `No se pudo leer tu negocio: ${e.message}`
            : 'No se pudo leer tu negocio. Intentá de nuevo.',
        );
        setNegocioId(null);
      } finally {
        setLeyendoVinculo(false);
      }
    }
    void leerVinculo();
  }, [uid]);

  function irANegocio(): void {
    navigation.navigate('Tabs', { screen: 'NegocioTab' });
  }

  async function usarMiUbicacion(): Promise<void> {
    if (leyendoGps) return;
    setLeyendoGps(true);
    setGpsAviso(null);
    try {
      const coords = await getUserCoords();
      if (!coords) {
        setGpsAviso(
          'No pudimos obtener tu ubicación (permiso denegado o sin señal). Seguimos con Lima por defecto.',
        );
      } else {
        setLatTxt(String(coords.latitude));
        setLngTxt(String(coords.longitude));
        setGpsAviso('Ubicación actualizada con tu GPS.');
      }
    } catch (e) {
      setGpsAviso(
        e instanceof Error
          ? `No pudimos obtener tu ubicación: ${e.message}. Seguimos con Lima por defecto.`
          : 'No pudimos obtener tu ubicación. Seguimos con Lima por defecto.',
      );
    } finally {
      setLeyendoGps(false);
    }
  }

  async function registrar(): Promise<void> {
    if (guardando || negocioId) return;
    setFormError(null);
    setFormOk(null);
    if (!uid) {
      setFormError('Iniciá sesión para registrar tu negocio.');
      return;
    }
    const nombreValido: string = nombre.trim();
    if (!nombreValido) {
      setFormError('El negocio necesita un nombre.');
      return;
    }
    const lat: number = Number(latTxt.replace(',', '.'));
    const lng: number = Number(lngTxt.replace(',', '.'));
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setFormError('La ubicación no es válida (revisá latitud y longitud).');
      return;
    }
    setGuardando(true);
    try {
      const id: string = await registrarNegocio({
        usuarioId: uid,
        nombre: nombreValido,
        descripcion: descripcion.trim(),
        direccion: direccion.trim(),
        lat,
        lng,
      });
      setNegocioId(id);
      // Refresca el rol para que el tab Negocio aparezca sin re-login.
      await refreshRol();
      setFormOk('¡Negocio registrado! Te llevamos a tu panel.');
      irANegocio();
    } catch (e) {
      setFormError(
        e instanceof Error
          ? e.message
          : 'No se pudo registrar el negocio. Intentá de nuevo.',
      );
    } finally {
      setGuardando(false);
    }
  }

  if (!firebaseReady) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>Registrar mi negocio</Text>
        <Text style={styles.subtitle}>
          Conectá Firebase (archivo .env) para registrar tu negocio.
        </Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>Registrar mi negocio</Text>
        <Text style={styles.subtitle}>Iniciá sesión para registrar tu negocio.</Text>
      </View>
    );
  }

  if (leyendoVinculo) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top + 12 }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.subtitle}>Leyendo tu negocio...</Text>
      </View>
    );
  }

  if (negocioId) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>Ya tenés un negocio</Text>
        {vinculoError ? <Text style={styles.error}>{vinculoError}</Text> : null}
        <Text style={styles.subtitle}>
          Esta cuenta ya tiene un negocio vinculado. No se puede registrar otro.
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={irANegocio}>
          <Text style={styles.primaryText}>Ir a mi negocio</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <Text style={styles.title}>Registrar mi negocio</Text>
      <Text style={styles.subtitle}>
        Queda vinculado a tu cuenta (un negocio por cuenta).
      </Text>
      {vinculoError ? <Text style={styles.error}>{vinculoError}</Text> : null}
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
      <TouchableOpacity
        style={[styles.primaryButton, guardando && styles.disabledButton]}
        disabled={guardando}
        onPress={() => void registrar()}
      >
        <Text style={styles.primaryText}>
          {guardando ? 'Registrando...' : 'Registrar'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: 12, padding: 16, backgroundColor: colors.background },
  center: { justifyContent: 'center', alignItems: 'center' },
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
  primaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  primaryText: { color: colors.surface, fontSize: 15, fontWeight: '700' },
  disabledButton: { opacity: 0.6 },
});
