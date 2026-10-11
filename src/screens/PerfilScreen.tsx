import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useNegocioId } from '../hooks/useNegocioId';
import { TabScreenProps } from '../navigation/TabScreenProps';
import { SettingRow } from '../components/SettingRow';
import { colors } from '../styles/colors';
import { nombreVisible } from '../utils/usuario';

type Props = TabScreenProps<'PerfilTab'>;

// Opciones del menú: cada una abre su ventana.
const OPCIONES: {
  icono: 'person-outline' | 'location-outline' | 'card-outline' | 'help-circle-outline' | 'settings-outline';
  texto: string;
  destino: 'MisDatos' | 'Direcciones' | 'MetodosPago' | 'Ayuda' | 'Configuracion';
}[] = [
  { icono: 'person-outline', texto: 'Mis datos', destino: 'MisDatos' },
  { icono: 'location-outline', texto: 'Direcciones', destino: 'Direcciones' },
  { icono: 'card-outline', texto: 'Métodos de pago', destino: 'MetodosPago' },
  { icono: 'help-circle-outline', texto: 'Ayuda y soporte', destino: 'Ayuda' },
  { icono: 'settings-outline', texto: 'Configuración', destino: 'Configuracion' },
];

export default function PerfilScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user, rol, logout } = useAuth();
  const { negocioId, loading: leyendoNegocio } = useNegocioId();

  const handleLogout = async () => {
    await logout();
    // La raíz (App.tsx) monta AuthNavigator sola al cerrarse la sesión.
  };

  const handleNegocio = () => {
    // Con negocio vinculado va directo al panel; si no, al form de registro.
    if (negocioId) {
      navigation.navigate('Tabs', { screen: 'NegocioTab' });
    } else {
      navigation.navigate('RegistrarNegocio');
    }
  };

  const nombreMostrado: string = nombreVisible(user, 'Invitado');
  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12 }]}>
    <ScrollView
      contentContainerStyle={styles.container}
    >
      {/* Area titulo */}
      <Text style={styles.title}>Mi perfil</Text>
      {/* Area tarjeta */}
      <View style={styles.card}>
        {/* Foto redonda o icono si no hay foto */}
        {user?.photoURL?.trim() ? (
          <Image source={{ uri: user.photoURL }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Ionicons name="person-outline" size={30} color={colors.primary} />
          </View>
        )}
        {/* Informacion */}
        <View style={styles.cardInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>{nombreMostrado}</Text>
            <View style={styles.rolPill}>
              <Ionicons name="person-outline" size={12} color={colors.primary} />
              <Text style={styles.rolPillText}>{rol ?? 'cliente'}</Text>
            </View>
          </View>
          <Text style={styles.email} numberOfLines={1}>{user?.email ?? 'Sin sesión'}</Text>
        </View>
      </View>
      {/* Area botones */}
      <TouchableOpacity
        style={[styles.negocioButton, leyendoNegocio && styles.disabledButton]}
        disabled={leyendoNegocio}
        onPress={handleNegocio}
      >
        {leyendoNegocio ? (
          <ActivityIndicator size="small" color={colors.surface} />
        ) : (
          <Text style={styles.negocioText}>
            {negocioId ? 'Ir a mi negocio' : 'Registrar mi negocio'}
          </Text>
        )}
      </TouchableOpacity>
      {/* Area menu */}
      <View style={styles.menu}>
        {OPCIONES.map((op, i) => (
          <View key={op.texto}>
            {i > 0 ? <View style={styles.menuDivider} /> : null}
            <SettingRow
              icono={op.icono}
              titulo={op.texto}
              onPress={() => navigation.navigate(op.destino)}
              accessibilityLabel={op.texto}
              tituloStyle={styles.menuText}
              right={
                <Ionicons name="chevron-forward" size={20} color={colors.textPlaceholder} />
              }
            />
          </View>
        ))}
      </View>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={colors.error} />
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Base
  screen: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, gap: 12, padding: 16, backgroundColor: colors.background },

  // Area titulo
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: '900' },

  // Area tarjeta
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  avatar: { width: 64, height: 64, borderRadius: 32 },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
  },
  // Informacion
  cardInfo: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  // Fila dato
  name: { flex: 1, color: colors.textPrimary, fontSize: 18, fontWeight: '800' },
  rolPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: colors.primarySoft,
  },
  rolPillText: { color: colors.primary, fontSize: 12, fontWeight: '800', textTransform: 'capitalize' },
  email: { color: colors.textMuted, fontSize: 14 },

  // Area botones
  negocioButton: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  negocioText: { color: colors.surface, fontSize: 15, fontWeight: '700' },
  disabledButton: { opacity: 0.6 },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.error,
    backgroundColor: colors.surface,
  },
  logoutText: { color: colors.error, fontSize: 15, fontWeight: '700' },

  // Area menu
  menu: {
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  menuText: { flex: 1, color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
  menuDivider: { height: 1, marginLeft: 60, backgroundColor: colors.border },
});
