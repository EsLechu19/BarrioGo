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
import { RootStackParamList } from '../navigation/RootStackParamList';
import { ScreenHeader } from '../components/ScreenHeader';
import { SettingRow } from '../components/SettingRow';
import { InfoBanner } from '../components/InfoBanner';
import { FormField } from '../components/FormField';
import { useAuth } from '../context/AuthContext';
import { updatePassword } from 'firebase/auth';
import { actualizarPerfilUsuario, getPerfilUsuario } from '../services/api';
import { useFotoUsuario } from '../hooks/useFotoUsuario';
import { useColors } from '../context/ThemeContext';
import type { Colors } from '../styles/colors';
import { inicialDe, nombreVisible } from '../utils/usuario';

type Props = NativeStackScreenProps<RootStackParamList, 'MisDatos'>;

export default function MisDatosScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [telefono, setTelefono] = useState<string>('');
  const [nuevaPass, setNuevaPass] = useState<string>('');
  const [confirmarPass, setConfirmarPass] = useState<string>('');
  const [telError, setTelError] = useState<string | undefined>(undefined);
  const [passError, setPassError] = useState<string | undefined>(undefined);
  const [exito, setExito] = useState<boolean>(false);
  const [fotoUrl, setFotoUrl] = useState<string>('');
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  useEffect(() => {
    if (!user) return;
    void getPerfilUsuario(user.uid).then((perfil) => {
      setTelefono(perfil.telefono);
      setFotoUrl(perfil.fotoUrl?.trim() ?? '');
    });
  }, [user]);

  // Foto de perfil: cámara/galería → Cloudinary → users/{uid}.fotoUrl.
  const {
    subiendo: subiendoFoto,
    error: fotoError,
    elegir: elegirFoto,
  } = useFotoUsuario({
    uid: user?.uid,
    onSubida: (url) => setFotoUrl(url),
  });

  // fotoUrl (subida en la app) manda; si no, la foto de Firebase Auth.
  const fotoVisible: string = fotoUrl || user?.photoURL?.trim() || '';

  const nombre: string = nombreVisible(user);
  const inicial: string = inicialDe(nombre);

  const filas: {
    icono: 'person-outline' | 'mail-outline' | 'calendar-outline';
    etiqueta: string;
    valor: string;
  }[] = [
    { icono: 'person-outline', etiqueta: 'Nombre', valor: nombre },
    { icono: 'mail-outline', etiqueta: 'Correo', valor: user?.email ?? 'Sin correo' },
    { icono: 'calendar-outline', etiqueta: 'Miembro desde', valor: '2026' },
  ];

  const guardar = async (): Promise<void> => {
    setExito(false);
    const digitos: string = telefono.trim().replace(/\s/g, '');
    let errorTel: string | undefined;
    if (digitos.length > 0) {
      if (!/^\d+$/.test(digitos)) {
        errorTel = 'Usa solo números.';
      } else if (digitos.length < 7) {
        errorTel = 'El teléfono debe tener al menos 7 dígitos.';
      }
    }
    let errorPass: string | undefined;
    if (nuevaPass || confirmarPass) {
      if (nuevaPass.length < 6) {
        errorPass = 'La contraseña debe tener al menos 6 caracteres.';
      } else if (nuevaPass !== confirmarPass) {
        errorPass = 'Las contraseñas no coinciden.';
      }
    }
    setTelError(errorTel);
    setPassError(errorPass);
    if (errorTel || errorPass) return;
    if (!user) return;
    try {
      await actualizarPerfilUsuario(user.uid, { telefono });
      if (nuevaPass) await updatePassword(user, nuevaPass);
      setNuevaPass('');
      setConfirmarPass('');
    } catch (error) {
      setPassError(
        error instanceof Error ? error.message : 'No se pudo guardar la contraseña.',
      );
      return;
    }
    setExito(true);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12 }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          titulo="Mis datos"
          onBack={() => navigation.goBack()}
          backAccessibilityLabel="Volver al perfil"
        />

        <View style={styles.profileCard}>
          <TouchableOpacity
            style={styles.avatarWrap}
            onPress={() => void elegirFoto(false)}
            disabled={subiendoFoto}
            accessibilityRole="button"
            accessibilityLabel="Cambiar foto de perfil"
          >
            {fotoVisible ? (
              <Image source={{ uri: fotoVisible }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>{inicial}</Text>
              </View>
            )}
            {/* Overlay de cámara sobre el avatar */}
            <View style={styles.avatarBadge}>
              {subiendoFoto ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Ionicons name="camera" size={16} color={colors.white} />
              )}
            </View>
          </TouchableOpacity>
          <Text style={styles.name}>{nombre}</Text>
          <Text style={styles.email} numberOfLines={1}>
            {user?.email ?? 'Sin sesión'}
          </Text>
          {/* Acciones de foto */}
          <View style={styles.fotoAcciones}>
            <TouchableOpacity
              style={[styles.fotoButton, subiendoFoto && styles.disabledButton]}
              onPress={() => void elegirFoto(false)}
              disabled={subiendoFoto}
              accessibilityRole="button"
              accessibilityLabel="Elegir foto de perfil desde la galería"
            >
              <Ionicons name="image-outline" size={16} color={colors.primary} />
              <Text style={styles.fotoButtonText}>Galería</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.fotoButton, subiendoFoto && styles.disabledButton]}
              onPress={() => void elegirFoto(true)}
              disabled={subiendoFoto}
              accessibilityRole="button"
              accessibilityLabel="Tomar foto de perfil con la cámara"
            >
              <Ionicons name="camera-outline" size={16} color={colors.primary} />
              <Text style={styles.fotoButtonText}>Cámara</Text>
            </TouchableOpacity>
          </View>
          {fotoError ? <Text style={styles.fotoError}>{fotoError}</Text> : null}
        </View>

        <View style={styles.card}>
          {filas.map((f, i) => (
            <View key={f.etiqueta}>
              {i > 0 ? <View style={styles.divider} /> : null}
              <SettingRow
                icono={f.icono}
                titulo={f.etiqueta}
                subtitulo={f.valor}
                tituloStyle={styles.label}
                subtituloStyle={styles.value}
                subtituloNumberOfLines={1}
              />
            </View>
          ))}
        </View>

        <View style={styles.formCard}>
          <View style={styles.formHeader}>
            <Ionicons name="call-outline" size={20} color={colors.primary} />
            <Text style={styles.formTitle}>Teléfono</Text>
          </View>
          <FormField
            label="Tu número"
            value={telefono}
            onChangeText={setTelefono}
            placeholder="Ej. 999 888 777"
            keyboardType="phone-pad"
            error={telError}
          />
        </View>

        <View style={styles.formCard}>
          <View style={styles.formHeader}>
            <Ionicons name="lock-closed-outline" size={20} color={colors.primary} />
            <Text style={styles.formTitle}>Cambiar contraseña</Text>
          </View>
          <FormField
            label="Nueva contraseña"
            value={nuevaPass}
            onChangeText={setNuevaPass}
            placeholder="Mínimo 6 caracteres"
            secureTextEntry
            error={passError}
          />
          <FormField
            label="Confirmar contraseña"
            value={confirmarPass}
            onChangeText={setConfirmarPass}
            placeholder="Repetí la contraseña"
            secureTextEntry
          />
        </View>

        {exito ? <InfoBanner texto="Cambios guardados correctamente." /> : null}

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={guardar}
          accessibilityRole="button"
          accessibilityLabel="Guardar cambios"
        >
          <Ionicons name="save-outline" size={18} color={colors.white} />
          <Text style={styles.primaryText}>Guardar cambios</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function makeStyles(c: Colors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.background },
    container: { flexGrow: 1, gap: 12, padding: 16, backgroundColor: c.background },

    profileCard: {
      alignItems: 'center',
      gap: 4,
      padding: 20,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      backgroundColor: c.surface,
    },
    avatar: { width: 84, height: 84, borderRadius: 42 },
    avatarWrap: { width: 84, height: 84 },
    avatarBadge: {
      position: 'absolute',
      right: 0,
      bottom: 0,
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: c.surface,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarPlaceholder: {
      backgroundColor: c.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: { color: c.primary, fontSize: 34, fontWeight: '900' },
    name: { color: c.textPrimary, fontSize: 19, fontWeight: '900' },
    email: { color: c.textMuted, fontSize: 14 },

    fotoAcciones: { flexDirection: 'row', gap: 8, marginTop: 8 },
    fotoButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: c.primary,
      borderRadius: 12,
      backgroundColor: c.surface,
    },
    disabledButton: { opacity: 0.5 },
    fotoButtonText: { color: c.primary, fontSize: 14, fontWeight: '700' },
    fotoError: { color: c.error, fontSize: 13, marginTop: 4, textAlign: 'center' },

    card: {
      paddingHorizontal: 6,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      backgroundColor: c.surface,
    },
    label: { color: c.textMuted, fontSize: 12, fontWeight: '600' },
    value: { color: c.textPrimary, fontSize: 15, fontWeight: '700' },
    divider: { height: 1, marginLeft: 60, backgroundColor: c.border },

    formCard: {
      gap: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      backgroundColor: c.surface,
    },
    formHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    formTitle: { color: c.textPrimary, fontSize: 15, fontWeight: '800' },

    primaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      borderRadius: 14,
      backgroundColor: c.primary,
    },
    primaryText: { color: c.white, fontSize: 15, fontWeight: '700' },
  });
}
