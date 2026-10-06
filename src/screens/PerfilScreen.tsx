import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { colors } from '../styles/colors';

export default function PerfilScreen() {
  const insets = useSafeAreaInsets();
  const { user, rol, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    // La raíz (App.tsx) monta AuthNavigator sola al cerrarse la sesión.
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <Text style={styles.title}>Mi perfil</Text>
      <View style={styles.card}>
        <Text style={styles.name}>{user?.email?.split('@')[0] ?? 'Invitado'}</Text>
        <Text style={styles.email}>{user?.email ?? 'Sin sesión'}</Text>
        <Text style={styles.role}>Rol: {rol ?? 'cliente'} (Firebase Auth)</Text>
      </View>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: 12, padding: 16, backgroundColor: colors.background },
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: '900' },
  card: {
    gap: 4,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  name: { color: colors.textPrimary, fontSize: 18, fontWeight: '800' },
  email: { color: colors.textMuted, fontSize: 14 },
  role: { color: colors.textPlaceholder, fontSize: 12, marginTop: 4 },
  logoutButton: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  logoutText: { color: colors.primary, fontSize: 15, fontWeight: '700' },
});
