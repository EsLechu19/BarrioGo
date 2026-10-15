import { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootStackParamList';
import { ScreenHeader } from '../components/ScreenHeader';
import { SettingRow } from '../components/SettingRow';
import { Colors } from '../styles/colors';
import { useTheme } from '../context/ThemeContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Configuracion'>;

function makeStyles(c: Colors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.background },
    container: {
      flexGrow: 1,
      gap: 12,
      padding: 16,
      backgroundColor: c.background,
    },

    card: {
      paddingHorizontal: 6,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      backgroundColor: c.surface,
    },
    divider: { height: 1, marginLeft: 60, backgroundColor: c.border },

    // Toggle personalizado (mismo lenguaje que el resto de la app): pista
    // redondeada + bolita deslizante, sin el Switch nativo.
    track: {
      width: 54,
      height: 32,
      borderRadius: 16,
      padding: 3,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      backgroundColor: c.border,
      borderWidth: 1,
      borderColor: c.border,
    },
    trackOn: { backgroundColor: c.primary, borderColor: c.primary },
    thumb: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.surface,
    },
    thumbOn: { marginLeft: 22 },
    thumbOff: { marginLeft: 0 },
  });
}

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
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
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

// Los otros 3 ajustes son solo diseño en memoria.
// TODO(back): persistir en AsyncStorage / users/{uid}.
export default function ConfiguracionScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [notifs, setNotifs] = useState<boolean>(true);
  const [ubicacion, setUbicacion] = useState<boolean>(true);
  const [ofertas, setOfertas] = useState<boolean>(false);

  const interruptores: {
    icono:
      | 'moon-outline'
      | 'notifications-outline'
      | 'location-outline'
      | 'pricetag-outline';
    titulo: string;
    subtitulo: string;
    valor: boolean;
    onCambiar: (v: boolean) => void;
  }[] = [
    {
      icono: 'moon-outline',
      titulo: 'Modo oscuro',
      subtitulo: 'Se recuerda al reabrir la app',
      valor: isDark,
      onCambiar: toggleTheme,
    },
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
      </ScrollView>
    </View>
  );
}
