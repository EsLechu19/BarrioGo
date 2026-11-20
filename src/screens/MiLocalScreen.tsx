import { useEffect, useMemo, useState } from 'react';
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
import { CategoriaNegocio, HorarioDia } from '../types/Negocio';
import { esCategoriaNegocio } from '../utils/cartaDiaria';
import { useNegocioId } from '../hooks/useNegocioId';
import { useUbicacionGps } from '../hooks/useUbicacionGps';
import { useFotoNegocio } from '../hooks/useFotoNegocio';
import { ScreenHeader } from '../components/ScreenHeader';
import { FormField } from '../components/FormField';
import { SelectorCategoria } from '../components/SelectorCategoria';
import { PrimaryButton } from '../components/PrimaryButton';
import { UbicacionInput } from '../components/UbicacionInput';
import { LoadingState } from '../components/StateView';
import { HorarioEditor } from '../components/negocio/HorarioEditor';
import { RootStackParamList } from '../navigation/RootStackParamList';
import { useColors } from '../context/ThemeContext';
import type { Colors } from '../styles/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'MiLocal'>;

const GUIA_SIN_NEGOCIO =
  'Todavía no tienes un negocio vinculado. Regístralo desde tu perfil para editarlo aquí.';

export default function MiLocalScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const uid: string | undefined = user?.uid;
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

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
  const [categoria, setCategoria] = useState<CategoriaNegocio | null>(null);
  const [descripcion, setDescripcion] = useState<string>('');
  const [direccion, setDireccion] = useState<string>('');
  const [tiempoEstimado, setTiempoEstimado] = useState<string>('');
  const [envioGratis, setEnvioGratis] = useState<boolean>(false);
  const [costoEnvioTxt, setCostoEnvioTxt] = useState<string>('');
  // Carta diaria (solo si el negocio es restaurante): precio del menú del
  // día (entrada+comida) y de cada extra.
  const [precioMenuTxt, setPrecioMenuTxt] = useState<string>('');
  const [precioExtraTxt, setPrecioExtraTxt] = useState<string>('');
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
  // Horario del negocio para precargar el editor; `horarioEditado` guarda los
  // cambios (undefined = no se tocó: no se envía y sigue el de servidor).
  const [horarioInicial, setHorarioInicial] = useState<HorarioDia[] | undefined>(undefined);
  const [horarioEditado, setHorarioEditado] = useState<HorarioDia[] | undefined>(undefined);
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

  // El estado 'cargandoNegocio' ya inicia en 'true' (línea 54) y el effect
  // que antes lo seteaba nuevamente ya no es necesario; el loading se gestiona
  // a través del flujo normal del formulario.
  useEffect(() => {
    let activo = true;
    const loadBusiness = async () => {
      try {
        if (!negocioId) return;
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
            categoria?: unknown;
            categorias?: unknown;
            descripcion?: unknown;
            direccion?: unknown;
            tiempoEstimado?: unknown;
            envioGratis?: unknown;
            costoEnvio?: unknown;
            precioMenuDia?: unknown;
            precioExtra?: unknown;
            lat?: unknown;
            lng?: unknown;
            imagen?: unknown;
            portada?: unknown;
            horario?: unknown;
          };
          if (typeof n.nombre === 'string') setNombre(n.nombre);
          if (esCategoriaNegocio(n.categoria)) setCategoria(n.categoria);
          else if (
            Array.isArray(n.categorias) &&
            n.categorias.length > 0 &&
            esCategoriaNegocio(n.categorias[0])
          ) {
            setCategoria(n.categorias[0]);
          }
          if (typeof n.descripcion === 'string') setDescripcion(n.descripcion);
          if (typeof n.direccion === 'string') setDireccion(n.direccion);
          if (typeof n.tiempoEstimado === 'string')
            setTiempoEstimado(n.tiempoEstimado);
          if (typeof n.envioGratis === 'boolean')
            setEnvioGratis(n.envioGratis);
          if (typeof n.costoEnvio === 'number' && n.costoEnvio > 0)
            setCostoEnvioTxt(String(n.costoEnvio));
          if (typeof n.precioMenuDia === 'number' && n.precioMenuDia > 0)
            setPrecioMenuTxt(String(n.precioMenuDia));
          if (typeof n.precioExtra === 'number' && n.precioExtra > 0)
            setPrecioExtraTxt(String(n.precioExtra));
          if (typeof n.lat === 'number' && Number.isFinite(n.lat))
            setLatTxt(String(n.lat));
          if (typeof n.lng === 'number' && Number.isFinite(n.lng))
            setLngTxt(String(n.lng));
          if (typeof n.imagen === 'string') setIconoUrl(n.imagen);
          if (typeof n.portada === 'string') setPortadaUrl(n.portada);
          // Chequeo de forma del horario (no confiar ciegamente en Firestore).
          if (Array.isArray(n.horario)) {
            const valido: boolean = n.horario.every(
              (f) =>
                typeof f === 'object' &&
                f !== null &&
                typeof (f as HorarioDia).dia === 'number' &&
                typeof (f as HorarioDia).apertura === 'string' &&
                typeof (f as HorarioDia).cierre === 'string',
            );
            if (valido) setHorarioInicial(n.horario as HorarioDia[]);
          }
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
    };
    loadBusiness();
    return () => {
      activo = false;
    };
  }, [negocioId, leyendoVinculo]);

  const cargando: boolean = leyendoVinculo || cargandoNegocio;
  const cargaError: string | null = vinculoError ?? negocioError;
  // Restaurante (carta diaria): muestra los campos de precio de menú/extra.
  const esRestauranteLocal: boolean = categoria === 'comida_criolla';

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
    const precioMenu: number = Number(precioMenuTxt.replace(',', '.'));
    const precioExtra: number = Number(precioExtraTxt.replace(',', '.'));
    if (esRestauranteLocal) {
      if (precioMenuTxt.trim() && !(precioMenu > 0)) {
        setFormError('El precio del menú del día debe ser mayor a 0.');
        return;
      }
      if (precioExtraTxt.trim() && !(precioExtra > 0)) {
        setFormError('El precio extra debe ser mayor a 0.');
        return;
      }
    }
    const costoEnvio: number = Number(costoEnvioTxt.replace(',', '.'));
    if (!envioGratis && costoEnvioTxt.trim() && !(costoEnvio > 0)) {
      setFormError('El costo de envío debe ser mayor a 0 (o dejalo vacío).');
      return;
    }
    setGuardando(true);
    try {
      await actualizarNegocio({
        negocioId,
        usuarioId: uid,
        nombre: nombreValido,
        ...(categoria ? { categoria } : {}),
        descripcion: descripcion.trim(),
        direccion: direccion.trim(),
        tiempoEstimado: tiempoEstimado.trim(),
        envioGratis,
        // Envío gratis => sin costo (0). Si no, el valor del campo (0 si vacío).
        costoEnvio: !envioGratis && costoEnvioTxt.trim() ? costoEnvio : 0,
        ...(esRestauranteLocal && precioMenuTxt.trim()
          ? { precioMenuDia: precioMenu }
          : {}),
        ...(esRestauranteLocal && precioExtraTxt.trim()
          ? { precioExtra }
          : {}),
        lat: latTxt.trim() ? lat : undefined,
        lng: lngTxt.trim() ? lng : undefined,
        // Solo si el dueño tocó el editor; array vacío = sin horario.
        horario: horarioEditado,
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
      <SelectorCategoria
        label="Categoría"
        valor={categoria}
        onChange={setCategoria}
      />
      {esRestauranteLocal ? (
        <>
          <FormField
            label="Precio del menú del día (S/)"
            placeholder="Ej. 10"
            keyboardType="decimal-pad"
            value={precioMenuTxt}
            onChangeText={setPrecioMenuTxt}
          />
          <FormField
            label="Precio extra (S/)"
            placeholder="Ej. 15"
            keyboardType="decimal-pad"
            value={precioExtraTxt}
            onChangeText={setPrecioExtraTxt}
          />
        </>
      ) : null}
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
      {/* Costo de envío: solo cuando el envío no es gratis */}
      {!envioGratis ? (
        <FormField
          label="Costo de envío (S/)"
          placeholder="Ej. 3.50 (vacío = sin costo)"
          value={costoEnvioTxt}
          onChangeText={setCostoEnvioTxt}
          keyboardType="decimal-pad"
        />
      ) : null}
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
      {/* Area horario (se persiste con "Guardar cambios") */}
      <Text style={styles.sectionTitle}>Horario de atención</Text>
      <HorarioEditor horario={horarioInicial} onChange={setHorarioEditado} />
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

function makeStyles(c: Colors) {
  return StyleSheet.create({
    // Base
    screen: { flex: 1, backgroundColor: c.background },
    container: { flexGrow: 1, gap: 12, padding: 16, backgroundColor: c.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    subtitle: { color: c.textMuted, fontSize: 14, textAlign: 'center' },
    error: { color: c.error, fontSize: 14, fontWeight: '600' },
    ok: { color: c.success, fontSize: 14, fontWeight: '600' },
    disabledButton: { opacity: 0.6 },

    // Area titulo
    title: { color: c.textPrimary, fontSize: 22, fontWeight: '900' },

    // Area formulario
    switchRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      backgroundColor: c.surface,
    },
    switchLabel: { color: c.textPrimary, fontSize: 15, fontWeight: '600' },
    // Toggle (mismo estilo que Configuración)
    toggleTrack: {
      width: 54,
      height: 32,
      borderRadius: 16,
      padding: 3,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      backgroundColor: c.border,
      borderWidth: 1,
      borderColor: c.border,
    },
    toggleTrackOn: { backgroundColor: c.primary, borderColor: c.primary },
    toggleThumb: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.surface,
    },
    toggleThumbOn: { marginLeft: 22 },
    toggleThumbOff: { marginLeft: 0 },

    // Area fotos
    sectionTitle: { color: c.textPrimary, fontSize: 17, fontWeight: '800' },
    // Fila foto
    fotoRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
    iconoPreview: { width: 72, height: 72, borderRadius: 14 },
    fotoBotones: { flex: 1, gap: 8 },
    fotoLabel: { color: c.textPrimary, fontSize: 14, fontWeight: '700' },
    fotoAcciones: { flexDirection: 'row', gap: 8 },
    fotoButton: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    fotoButtonText: { color: c.primary, fontSize: 14, fontWeight: '700' },
    // Fila foto
    fotoColumna: { gap: 8 },
    portadaPreview: { width: '100%', height: 140, borderRadius: 14 },
    placeholder: {
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    placeholderText: { color: c.textMuted, fontSize: 13 },
  });
}
