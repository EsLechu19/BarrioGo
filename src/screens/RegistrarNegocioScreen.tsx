
import { useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAuth } from '../context/AuthContext';
import { firebaseReady } from '../services/firebase';
import { registrarNegocio } from '../services/api';
import { useNegocioId } from '../hooks/useNegocioId';
import { useUbicacionGps } from '../hooks/useUbicacionGps';
import { UbicacionInput } from '../components/UbicacionInput';
import { FormField } from '../components/FormField';
import { SelectorCategoria } from '../components/SelectorCategoria';
import { PrimaryButton } from '../components/PrimaryButton';
import { LoadingState } from '../components/StateView';
import { CategoriaNegocio } from '../types/Negocio';
import { RootStackParamList } from '../navigation/RootStackParamList';
import { useColors } from '../context/ThemeContext';
import type { Colors } from '../styles/colors';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'RegistrarNegocio'
>;

// Botón de retroceso - definido fuera para no crearse en cada render
function BotonVolver({ navigation, styles }: { navigation: any; styles: any }) {
  const canGoBack = navigation.canGoBack();
  if (!canGoBack) return null;

  return (
    <Pressable
      onPress={() => navigation.goBack()}
      accessibilityRole="button"
      accessibilityLabel="Volver a la pantalla anterior"
      hitSlop={8}
      style={({ pressed }) => [
        styles.backButton,
        pressed && styles.backButtonPressed,
      ]}
    >
      <Text style={styles.backIcon}>←</Text>
    </Pressable>
  );
}

// GPS denegado o sin hardware: el registro sigue
// con Lima por defecto y permite editar coordenadas.
const DEFAULT_LAT = -12.0464;
const DEFAULT_LNG = -77.0428;

export default function RegistrarNegocioScreen({
  navigation,
}: Props) {
  const insets = useSafeAreaInsets();
  const { user, refreshRol } = useAuth();
  const uid: string | undefined = user?.uid;

  // Un negocio por cuenta.
  const {
    negocioId,
    loading: leyendoVinculo,
    error: vinculoError,
    setNegocioId,
  } = useNegocioId();

  const [nombre, setNombre] = useState<string>('');
  const [categoria, setCategoria] =
    useState<CategoriaNegocio | null>(null);
  const [descripcion, setDescripcion] = useState<string>('');
  const [direccion, setDireccion] = useState<string>('');
  const [latTxt, setLatTxt] = useState<string>(
    String(DEFAULT_LAT)
  );
  const [lngTxt, setLngTxt] = useState<string>(
    String(DEFAULT_LNG)
  );

  const {
    leyendo: leyendoGps,
    aviso: gpsAviso,
    usar: obtenerUbicacion,
  } = useUbicacionGps({
    mensajeSinUbicacion:
      'No pudimos obtener tu ubicación (permiso denegado o sin señal). Seguimos con Lima por defecto.',
    mensajeExito:
      'Ubicación actualizada con tu GPS.',
    mensajeError: (e) =>
      e instanceof Error
        ? `No pudimos obtener tu ubicación: ${e.message}. Seguimos con Lima por defecto.`
        : 'No pudimos obtener tu ubicación. Seguimos con Lima por defecto.',
  });

  const [guardando, setGuardando] = useState<boolean>(false);
  const [formError, setFormError] =
    useState<string | null>(null);
  const [formOk, setFormOk] =
    useState<string | null>(null);

  const colors = useColors();
  const styles = useMemo(
    () => makeStyles(colors),
    [colors]
  );

  async function usarMiUbicacion(): Promise<void> {
    const coords = await obtenerUbicacion();

    if (coords) {
      setLatTxt(String(coords.latitude));
      setLngTxt(String(coords.longitude));
    }
  }

  function irANegocio(): void {
    navigation.navigate('Tabs', {
      screen: 'NegocioTab',
    });
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

    if (!categoria) {
      setFormError('Elegí la categoría de tu negocio.');
      return;
    }

    const lat: number = Number(
      latTxt.replace(',', '.')
    );
    const lng: number = Number(
      lngTxt.replace(',', '.')
    );

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng)
    ) {
      setFormError(
        'La ubicación no es válida (revisá latitud y longitud).'
      );
      return;
    }

    setGuardando(true);

    try {
      const id: string = await registrarNegocio({
        usuarioId: uid,
        nombre: nombreValido,
        categoria,
        descripcion: descripcion.trim(),
        direccion: direccion.trim(),
        lat,
        lng,
      });

      setNegocioId(id);

      // Refrescar rol sin volver a iniciar sesión.
      await refreshRol();

      setFormOk(
        '¡Negocio registrado! Te llevamos a tu panel.'
      );

      irANegocio();
    } catch (e) {
      setFormError(
        e instanceof Error
          ? e.message
          : 'No se pudo registrar el negocio. Intentá de nuevo.'
      );
    } finally {
      setGuardando(false);
    }
  }

  if (!firebaseReady) {
    return (
      <View
        style={[
          styles.container,
          styles.center,
          { paddingTop: insets.top + 12 },
        ]}
      >
        <Text style={styles.title}>
          Registrar mi negocio
        </Text>

        <Text style={styles.subtitle}>
          Conectá Firebase (archivo .env) para
          registrar tu negocio.
        </Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View
        style={[
          styles.container,
          styles.center,
          { paddingTop: insets.top + 12 },
        ]}
      >
        <Text style={styles.title}>
          Registrar mi negocio
        </Text>

        <Text style={styles.subtitle}>
          Iniciá sesión para registrar tu negocio.
        </Text>
      </View>
    );
  }

  if (leyendoVinculo) {
    return (
      <LoadingState
        mensaje="Leyendo tu negocio..."
        style={[
          styles.container,
          styles.center,
          { paddingTop: insets.top + 12 },
        ]}
        textoStyle={styles.subtitle}
      />
    );
  }

  if (negocioId) {
    return (
      <View
        style={[
          styles.container,
          styles.center,
          { paddingTop: insets.top + 12 },
        ]}
      >
        <Text style={styles.title}>
          Ya tienes un negocio
        </Text>

        {vinculoError ? (
          <Text style={styles.error}>
            {vinculoError}
          </Text>
        ) : null}

        <Text style={styles.subtitle}>
          Esta cuenta ya tiene un negocio vinculado.
          No se puede registrar otro.
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={irANegocio}
        >
          <Text style={styles.primaryText}>
            Ir a mi negocio
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 12 },
      ]}
    >
      {/* Encabezado: botón y título alineados */}
      <View style={styles.header}>
        <BotonVolver navigation={navigation} styles={styles} />

        <Text
          style={styles.title}
          numberOfLines={2}
        >
          Registrar mi negocio
        </Text>
      </View>

      <Text style={styles.subtitle}>
        Queda vinculado a tu cuenta
        (un negocio por cuenta).
      </Text>

      {vinculoError ? (
        <Text style={styles.error}>
          {vinculoError}
        </Text>
      ) : null}

      {/* Formulario */}
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

      {/* GPS */}
      <UbicacionInput
        leyendo={leyendoGps}
        aviso={gpsAviso}
        onUsar={() => void usarMiUbicacion()}
        lat={latTxt}
        lng={lngTxt}
        onLatChange={setLatTxt}
        onLngChange={setLngTxt}
      />

      {formError ? (
        <Text style={styles.error}>
          {formError}
        </Text>
      ) : null}

      {formOk ? (
        <Text style={styles.ok}>
          {formOk}
        </Text>
      ) : null}

      {/* Guardar */}
      <PrimaryButton
        title={guardando ? 'Registrando...' : 'Registrar'}
        onPress={() => void registrar()}
        disabled={guardando}
      />
    </View>
  );
}

function makeStyles(c: Colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      gap: 12,
      padding: 16,
      backgroundColor: c.background,
    },

    center: {
      justifyContent: 'center',
      alignItems: 'center',
    },

    subtitle: {
      color: c.textMuted,
      fontSize: 14,
      textAlign: 'center',
    },

    error: {
      color: c.error,
      fontSize: 14,
      fontWeight: '600',
    },

    ok: {
      color: c.success,
      fontSize: 14,
      fontWeight: '600',
    },

    // Encabezado horizontal
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 8,
    },

    title: {
      color: c.textPrimary,
      fontSize: 22,
      fontWeight: '900',
      flexShrink: 1,
    },

    // Botón circular de retroceso
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.background,
      borderWidth: 1,
      borderColor: c.textMuted,
      elevation: 2,
    },

    backButtonPressed: {
      opacity: 0.7,
      transform: [{ scale: 0.96 }],
    },

    backIcon: {
      fontSize: 25,
      fontWeight: '600',
      color: c.primary,
      lineHeight: 30,
    },

    primaryButton: {
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: 14,
      alignItems: 'center',
      backgroundColor: c.primary,
    },

    primaryText: {
      color: c.white,
      fontSize: 15,
      fontWeight: '700',
    },
  });
}
