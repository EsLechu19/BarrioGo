import { useState } from 'react';
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
import { useAuth } from '../context/AuthContext';
import { colors } from '../styles/colors';
import { inicialDe, nombreVisible } from '../utils/usuario';

type Props = NativeStackScreenProps<RootStackParamList, 'MisDatos'>;

// TODO(back): leer/escribir users/{uid} (nombre, teléfono) en Firestore.
export default function MisDatosScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [aviso, setAviso] = useState<boolean>(false);

  const nombre: string = nombreVisible(user);
  const inicial: string = inicialDe(nombre);

  const filas: { icono: 'person-outline' | 'mail-outline' | 'call-outline' | 'calendar-outline'; etiqueta: string; valor: string }[] = [
    { icono: 'person-outline', etiqueta: 'Nombre', valor: nombre },
    { icono: 'mail-outline', etiqueta: 'Correo', valor: user?.email ?? 'Sin correo' },
    { icono: 'call-outline', etiqueta: 'Teléfono', valor: '999 888 777' },
    { icono: 'calendar-outline', etiqueta: 'Miembro desde', valor: '2026' },
  ];

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

      {aviso ? (
        <InfoBanner texto="Pronto: editar tus datos desde aquí (solo diseño)." />
      ) : null}

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => setAviso(true)}
        accessibilityRole="button"
        accessibilityLabel="Editar mis datos (diseño)"
      >
        <Ionicons name="create-outline" size={18} color={colors.surface} />
        <Text style={styles.primaryText}>Editar datos</Text>
      </TouchableOpacity>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, gap: 12, padding: 16, backgroundColor: colors.background },

  profileCard: {
    alignItems: 'center',
    gap: 4,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  avatar: { width: 84, height: 84, borderRadius: 42 },
  avatarPlaceholder: {
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.primary, fontSize: 34, fontWeight: '900' },
  name: { color: colors.textPrimary, fontSize: 19, fontWeight: '900' },
  email: { color: colors.textMuted, fontSize: 14 },

  card: {
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  label: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  value: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' },
  divider: { height: 1, marginLeft: 60, backgroundColor: colors.border },

  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: colors.primary,
  },
  primaryText: { color: colors.surface, fontSize: 15, fontWeight: '700' },
});
