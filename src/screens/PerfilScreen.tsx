
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  useCallback,
  useMemo,
  useState,
} from 'react';

import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../context/AuthContext';
import { getPerfilUsuario } from '../services/api';
import { useNegocioId } from '../hooks/useNegocioId';
import { TabScreenProps } from '../navigation/TabScreenProps';
import { SettingRow } from '../components/SettingRow';
import { useColors } from '../context/ThemeContext';
import type { Colors } from '../styles/colors';
import { nombreVisible } from '../utils/usuario';

type Props = TabScreenProps<'PerfilTab'>;

const OPCIONES: {
  icono:
    | 'person-outline'
    | 'location-outline'
    | 'card-outline'
    | 'help-circle-outline'
    | 'settings-outline';
  texto: string;
  destino:
    | 'MisDatos'
    | 'Direcciones'
    | 'MetodosPago'
    | 'Ayuda'
    | 'Configuracion';
}[] = [
  {
    icono: 'person-outline',
    texto: 'Mis datos',
    destino: 'MisDatos',
  },
  {
    icono: 'location-outline',
    texto: 'Direcciones',
    destino: 'Direcciones',
  },
  {
    icono: 'card-outline',
    texto: 'Métodos de pago',
    destino: 'MetodosPago',
  },
  {
    icono: 'help-circle-outline',
    texto: 'Ayuda y soporte',
    destino: 'Ayuda',
  },
  {
    icono: 'settings-outline',
    texto: 'Configuración',
    destino: 'Configuracion',
  },
];

export default function PerfilScreen({
  navigation,
}: Props) {
  const insets = useSafeAreaInsets();

  const {
    user,
    rol,
    logout,
    refreshRol,
  } = useAuth();

  const {
    negocioId,
    loading: leyendoNegocio,
    error: errorNegocio,
  } = useNegocioId();

  const [fotoUrl, setFotoUrl] = useState<string>('');
  const [verificandoRol, setVerificandoRol] = useState(false);

  const colors = useColors();

  const styles = useMemo(
    () => makeStyles(colors),
    [colors]
  );

  useFocusEffect(
    useCallback(() => {
      if (!user?.uid) {
        setFotoUrl('');
        return;
      }

      let activo = true;

      void getPerfilUsuario(user.uid)
        .then(perfil => {
          if (activo) {
            setFotoUrl(perfil.fotoUrl?.trim() ?? '');
          }
        })
        .catch(error => {
          console.warn(
            '[PERFIL] Error recuperando foto:',
            error
          );
        });

      return () => {
        activo = false;
      };
    }, [user])
  );

  const fotoVisible: string =
    fotoUrl || user?.photoURL?.trim() || '';

  const handleLogout = async () => {
    await logout();
  };

  const handleNegocio = async () => {
    if (leyendoNegocio || verificandoRol) return;

    if (errorNegocio) {
      Alert.alert(
        'No se pudo consultar tu negocio',
        errorNegocio
      );
      return;
    }

    if (!negocioId) {
      navigation.navigate('RegistrarNegocio');
      return;
    }

    if (rol === 'negocio') {
      navigation.navigate('Tabs', {
        screen: 'NegocioTab',
      });
      return;
    }

    // Existe negocio, pero el contexto no reconoce el rol.
    setVerificandoRol(true);

    try {
      await refreshRol();

      // El estado de React se actualizará en el siguiente render.
      // No navegamos todavía para evitar una ruta inexistente.
      Alert.alert(
        'Verificación de negocio',
        'Se actualizó la información de tu cuenta. ' +
        'Si aparece la pestaña Negocio, puedes ingresar desde allí.'
      );
    } catch (error) {
      console.error(
        '[PERFIL] Error actualizando rol:',
        error
      );

      Alert.alert(
        'Error',
        'No se pudo verificar tu rol. Intenta nuevamente.'
      );
    } finally {
      setVerificandoRol(false);
    }
  };

  const nombreMostrado: string =
    nombreVisible(user, 'Invitado');

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top + 12 },
      ]}
    >
      <ScrollView
        contentContainerStyle={styles.container}
      >
        <Text style={styles.title}>
          Mi perfil
        </Text>


        <View style={styles.card}>
          {fotoVisible ? (
            <Image
              source={{ uri: fotoVisible }}
              style={styles.avatar}
            />
          ) : (
            <View
              style={[
                styles.avatar,
                styles.avatarPlaceholder,
              ]}
            >
              <Ionicons
                name="person-outline"
                size={30}
                color={colors.primary}
              />
            </View>
          )}

          <View style={styles.cardInfo}>
            <View style={styles.nameRow}>
              <Text
                style={styles.name}
                numberOfLines={1}
              >
                {nombreMostrado}
              </Text>

              <View style={styles.rolPill}>
                <Ionicons
                  name="person-outline"
                  size={12}
                  color={colors.primary}
                />

                <Text style={styles.rolPillText}>
                  {rol ?? 'Sin verificar'}
                </Text>
              </View>
            </View>

            <Text
              style={styles.email}
              numberOfLines={1}
            >
              {user?.email ?? 'Sin sesión'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.negocioButton,
            (leyendoNegocio || verificandoRol) &&
              styles.disabledButton,
          ]}
          disabled={
            leyendoNegocio || verificandoRol
          }
          onPress={handleNegocio}
        >
          {leyendoNegocio || verificandoRol ? (
            <ActivityIndicator
              size="small"
              color={colors.white}
            />
          ) : (
            <Text style={styles.negocioText}>
              {negocioId
                ? 'Ir a mi negocio'
                : 'Registrar mi negocio'}
            </Text>
          )}
        </TouchableOpacity>

        <View style={styles.menu}>
          {OPCIONES.map((op, i) => (
            <View key={op.texto}>
              {i > 0 && (
                <View style={styles.menuDivider} />
              )}

              <SettingRow
                icono={op.icono}
                titulo={op.texto}
                onPress={() =>
                  navigation.navigate(op.destino)
                }
                accessibilityLabel={op.texto}
                tituloStyle={styles.menuText}
                right={
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={colors.textPlaceholder}
                  />
                }
              />
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons
            name="log-out-outline"
            size={20}
            color={colors.error}
          />

          <Text style={styles.logoutText}>
            Cerrar sesión
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function makeStyles(c: Colors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: c.background,
    },
    container: {
      flexGrow: 1,
      gap: 12,
      padding: 16,
      backgroundColor: c.background,
    },
    title: {
      color: c.textPrimary,
      fontSize: 22,
      fontWeight: '900',
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      backgroundColor: c.surface,
    },
    avatar: {
      width: 64,
      height: 64,
      borderRadius: 32,
    },
    avatarPlaceholder: {
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: c.primarySoft,
    },
    cardInfo: {
      flex: 1,
      gap: 4,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    name: {
      flex: 1,
      color: c.textPrimary,
      fontSize: 18,
      fontWeight: '800',
    },
    rolPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
      backgroundColor: c.primarySoft,
    },
    rolPillText: {
      color: c.primary,
      fontSize: 12,
      fontWeight: '800',
      textTransform: 'capitalize',
    },
    email: {
      color: c.textMuted,
      fontSize: 14,
    },
    negocioButton: {
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: 'center',
      backgroundColor: c.primary,
    },
    negocioText: {
      color: c.white,
      fontSize: 15,
      fontWeight: '700',
    },
    disabledButton: {
      opacity: 0.6,
    },
    logoutButton: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 14,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: c.error,
      backgroundColor: c.surface,
    },
    logoutText: {
      color: c.error,
      fontSize: 15,
      fontWeight: '700',
    },
    menu: {
      paddingHorizontal: 6,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      backgroundColor: c.surface,
    },
    menuText: {
      flex: 1,
      color: c.textPrimary,
      fontSize: 15,
      fontWeight: '600',
    },
    menuDivider: {
      height: 1,
      marginLeft: 60,
      backgroundColor: c.border,
    },
    debugBox: {
      padding: 12,
      backgroundColor: '#FFF3CD',
      borderRadius: 10,
    },
    debugText: {
      color: '#000000',
      fontSize: 13,
    },
  });
}
