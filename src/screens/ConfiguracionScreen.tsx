import { useState } from 'react';
import {
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
import { colors } from '../styles/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Configuracion'>;

// Toggle personalizado (mismo lenguaje que el resto de la app): pista
// redondeada + bolita deslizante, sin el Switch nativo.
function AjusteToggle({
  encendido,
  onCambiar,
  etiqueta,
}: {
  encendido: boolean;
  onCambiar: (v: boolean) => void;
  etiqueta: string;
}) {
  return (
    <TouchableOpacity
      style={[styles.track, encendido && styles.trackOn]}
      onPress={() => onCambiar(!encendido)}
      activeOpacity={0.8}
      accessibilityRole="switch"
      accessibilityState={{ checked: encendido }}
      accessibilityLabel={etiqueta}
    >
      <View style={[styles.thumb, encendido ? styles.thumbOn : styles.thumbOff]}>
        {encendido ? (
          <Ionicons name="checkmark" size={14} color={colors.primary} />
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

// TODO(back): persistir en AsyncStorage / users/{uid} (solo diseño en memoria).
export default function ConfiguracionScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [notifs, setNotifs] = useState<boolean>(true);
  const [ubicacion, setUbicacion] = useState<boolean>(true);
  const [ofertas, setOfertas] = useState<boolean>(false);

  const interruptores: {
    icono: 'notifications-outline' | 'location-outline' | 'pricetag-outline';
    titulo: string;
    subtitulo: string;
    valor: boolean;
    onCambiar: (v: boolean) => void;
  }[] = [
    {
      icono: 'notifications-outline',
      titulo: 'Notificaciones de pedidos',
      subtitulo: 'Confirmado, en camino y entregado',
      valor: notifs,
      onCambiar: setNotifs,
    },
    {
      icono: 'location-outline',
      titulo: 'Ubicación',
      subtitulo: 'Ordenar negocios por cercanía',
      valor: ubicacion,
      onCambiar: setUbicacion,
    },
    {
      icono: 'pricetag-outline',
      titulo: 'Ofertas y novedades',
      subtitulo: 'Promos de tus locales favoritos',
      valor: ofertas,
      onCambiar: setOfertas,
    },
  ];

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12 }]}>
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader
        titulo="Configuración"
        onBack={() => navigation.goBack()}
        backAccessibilityLabel="Volver al perfil"
      />

      <View style={styles.card}>
        {interruptores.map((op, i) => (
          <View key={op.titulo}>
            {i > 0 ? <View style={styles.divider} /> : null}
            <SettingRow
              icono={op.icono}
              titulo={op.titulo}
              subtitulo={op.subtitulo}
              right={
                <AjusteToggle
                  encendido={op.valor}
                  onCambiar={op.onCambiar}
                  etiqueta={op.titulo}
                />
              }
            />
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <SettingRow
          icono="information-circle-outline"
          titulo="Acerca de BarrioGo"
          subtitulo="Versión 1.0.0"
        />
      </View>

      <Text style={styles.hint}>
        Los cambios se guardan solo en esta sesión (diseño).
      </Text>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, gap: 12, padding: 16, backgroundColor: colors.background },

  card: {
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  divider: { height: 1, marginLeft: 60, backgroundColor: colors.border },

  // Toggle personalizado
  track: {
    width: 54,
    height: 32,
    borderRadius: 16,
    padding: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: colors.border,
    borderWidth: 1,
    borderColor: colors.border,
  },
  trackOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  thumbOn: { marginLeft: 22 },
  thumbOff: { marginLeft: 0 },
  hint: { color: colors.textMuted, fontSize: 12, textAlign: 'center' },
});
