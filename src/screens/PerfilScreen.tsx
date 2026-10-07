import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { firebaseReady, getFirestoreDb } from '../services/firebase';
import { RootStackParamList } from '../navigation/RootStackParamList';
import { TabParamList } from '../navigation/TabParamList';
import { colors } from '../styles/colors';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'PerfilTab'>,
  NativeStackScreenProps<RootStackParamList>
>;

export default function PerfilScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user, rol, logout } = useAuth();
  const uid: string | undefined = user?.uid;

  const [negocioId, setNegocioId] = useState<string | null>(null);
  const [leyendoNegocio, setLeyendoNegocio] = useState<boolean>(true);

  useEffect(() => {
    async function leerNegocioId(): Promise<void> {
      if (!firebaseReady || !uid) {
        setLeyendoNegocio(false);
        return;
      }
      setLeyendoNegocio(true);
      try {
        const snap = await getDoc(doc(getFirestoreDb(), 'users', uid));
        const data: unknown = snap.exists() ? snap.data() : null;
        const id: unknown =
          typeof data === 'object' && data !== null
            ? (data as { negocioId?: unknown }).negocioId
            : undefined;
        setNegocioId(typeof id === 'string' && id.trim() ? id : null);
      } catch {
        setNegocioId(null);
      } finally {
        setLeyendoNegocio(false);
      }
    }
    void leerNegocioId();
  }, [uid]);

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

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <Text style={styles.title}>Mi perfil</Text>
      <View style={styles.card}>
        <Text style={styles.name}>{user?.email?.split('@')[0] ?? 'Invitado'}</Text>
        <Text style={styles.email}>{user?.email ?? 'Sin sesión'}</Text>
        <Text style={styles.role}>Rol: {rol ?? 'cliente'} (Firebase Auth)</Text>
      </View>
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
  negocioButton: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  negocioText: { color: colors.surface, fontSize: 15, fontWeight: '700' },
  disabledButton: { opacity: 0.6 },
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
