import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootStackParamList';
import { ScreenHeader } from '../components/ScreenHeader';
import { useAuth } from '../context/AuthContext';
import { storage } from '../services/storage';
import type { Notificacion } from '../types/Notificacion';
import { ESTADO_ICONS } from '../utils/estadosPedido';
import { fechaLarga } from '../utils/fechas';
import { useColors } from '../context/ThemeContext';
import type { Colors } from '../styles/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Notificaciones'>;

export default function NotificacionesScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [notifications, setNotifications] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(async (): Promise<void> => {
    if (!user?.uid) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setNotifications(await storage.loadNotifications(user.uid));
    } catch {
      setError('No pudimos cargar tus notificaciones. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12 }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          titulo="Notificaciones"
          subtitulo="Novedades de tus pedidos"
          onBack={() => navigation.goBack()}
          backAccessibilityLabel="Volver al inicio"
        />

        <View style={styles.card}>
          {!user ? <Text style={styles.stateText}>Iniciá sesión para ver tus notificaciones.</Text> : null}
          {user && loading ? (
            <View style={styles.stateBlock}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.stateText}>Cargando notificaciones...</Text>
            </View>
          ) : null}
          {user && !loading && error ? <Text style={styles.error}>{error}</Text> : null}
          {user && !loading && !error && notifications.length === 0 ? (
            <Text style={styles.stateText}>Todavía no tenés novedades de tus pedidos.</Text>
          ) : null}
          {user && !loading && !error
            ? notifications.map((notification, index) => (
                <View key={notification.id}>
                  {index > 0 ? <View style={styles.divider} /> : null}
                  <View style={styles.row}>
                    <View style={styles.iconCircle}>
                      <Ionicons
                        name={ESTADO_ICONS[notification.estado]}
                        size={20}
                        color={colors.primary}
                      />
                    </View>
                    <View style={styles.textBlock}>
                      <Text style={styles.texto}>{notification.texto}</Text>
                      <Text style={styles.hora}>{fechaLarga(notification.creadaEn)}</Text>
                    </View>
                  </View>
                </View>
              ))
            : null}
        </View>
      </ScrollView>
    </View>
  );
}

function makeStyles(c: Colors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.background },
    container: { flexGrow: 1, gap: 12, padding: 16, backgroundColor: c.background },
    card: {
      paddingHorizontal: 6,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      backgroundColor: c.surface,
    },
    divider: { height: 1, marginLeft: 60, backgroundColor: c.border },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 10,
      paddingVertical: 13,
    },
    iconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    textBlock: { flex: 1, gap: 2 },
    texto: { color: c.textPrimary, fontSize: 14, fontWeight: '600', lineHeight: 20 },
    hora: { color: c.textMuted, fontSize: 12 },
    stateBlock: { alignItems: 'center', gap: 8, paddingVertical: 20 },
    stateText: { color: c.textMuted, fontSize: 14, textAlign: 'center', padding: 20 },
    error: { color: c.error, fontSize: 14, textAlign: 'center', padding: 20 },
  });
}
