import { useMemo, useState } from 'react';
import {
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
import { useColors } from '../context/ThemeContext';
import type { Colors } from '../styles/colors';
import { inicialDe, nombreVisible } from '../utils/usuario';

type Props = NativeStackScreenProps<RootStackParamList, 'MisDatos'>;

// TODO(back): teléfono → users/{uid} en Firestore; contraseña →
// updatePassword de Firebase Auth. Hoy todo vive en memoria (solo diseño).
export default function MisDatosScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [telefono, setTelefono] = useState<string>('999 888 777');
  const [nuevaPass, setNuevaPass] = useState<string>('');
  const [confirmarPass, setConfirmarPass] = useState<string>('');
  const [telError, setTelError] = useState<string | undefined>(undefined);
  const [passError, setPassError] = useState<string | undefined>(undefined);
  const [exito, setExito] = useState<boolean>(false);
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

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

  const guardar = (): void => {
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
    setNuevaPass('');
    setConfirmarPass('');
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
          {user?.photoURL?.trim() ? (
            <Image source={{ uri: user.photoURL }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>{inicial}</Text>
            </View>
          )}
          <Text style={styles.name}>{nombre}</Text>
          <Text style={styles.email} numberOfLines={1}>
            {user?.email ?? 'Sin sesión'}
          </Text>
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

        {exito ? <InfoBanner texto="Cambios guardados en esta sesión." /> : null}

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
    avatarPlaceholder: {
      backgroundColor: c.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: { color: c.primary, fontSize: 34, fontWeight: '900' },
    name: { color: c.textPrimary, fontSize: 19, fontWeight: '900' },
    email: { color: c.textMuted, fontSize: 14 },

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
