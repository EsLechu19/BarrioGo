import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootStackParamList';
import { TabParamList } from '../navigation/TabParamList';
import { useCart } from '../context/CartContext';
import { colors } from '../styles/colors';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'PerfilTab'>,
  NativeStackScreenProps<RootStackParamList>
>;

export default function PerfilScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { clear } = useCart();

  const handleLogout = () => {
    clear();
    navigation.getParent()?.navigate('Login');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <Text style={styles.title}>Mi perfil</Text>
      <View style={styles.card}>
        <Text style={styles.name}>Juan</Text>
        <Text style={styles.email}>juan@ejemplo.com</Text>
        <Text style={styles.note}>Sesión simulada — login real con Firebase en APF3.</Text>
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
  note: { color: colors.textPlaceholder, fontSize: 12, marginTop: 4 },
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
