import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
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
import { SelectableCard } from '../components/SelectableCard';
import { FormField } from '../components/FormField';
import { useColors } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { storage } from '../services/storage';
import type { Colors } from '../styles/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Direcciones'>;

interface DireccionMock {
  id: string;
  alias: string;
  detalle: string;
  esPrincipal: boolean;
}

// TODO(back): colección `users/{uid}/direcciones` en Firestore.
// Las direcciones que se añaden hoy solo viven en memoria (solo diseño):
// se pierden al salir de la pantalla.
const DIRECCIONES_MOCK: DireccionMock[] = [
  { id: 'd1', alias: 'Casa', detalle: 'Av. Mi casa 123, Lima', esPrincipal: true },
  { id: 'd2', alias: 'Trabajo', detalle: 'Av. Arequipa 2450, Lima', esPrincipal: false },
];

export default function DireccionesScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [direcciones, setDirecciones] = useState<DireccionMock[]>(DIRECCIONES_MOCK);
  const [seleccionada, setSeleccionada] = useState<string>('d1');
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [alias, setAlias] = useState<string>('');
  const [detalle, setDetalle] = useState<string>('');
  const [aliasError, setAliasError] = useState<string | undefined>(undefined);
  const [detalleError, setDetalleError] = useState<string | undefined>(undefined);
  const { user } = useAuth();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  useEffect(() => {
    const usuarioId: string | undefined = user?.uid;
    if (!usuarioId) return;
    let activa = true;
    void storage.loadCheckoutAddress(usuarioId).then((direccion) => {
      if (!activa) return;
      if (!direccion) {
        setSeleccionada('d1');
        return;
      }
      const encontrada: DireccionMock | undefined = DIRECCIONES_MOCK.find(
        (item) => item.alias === direccion.alias && item.detalle === direccion.detalle,
      );
      setSeleccionada(encontrada?.id ?? 'd1');
    });
    return () => {
      activa = false;
    };
  }, [user?.uid]);

  const abrirModal = (): void => {
    setAlias('');
    setDetalle('');
    setAliasError(undefined);
    setDetalleError(undefined);
    setModalVisible(true);
  };

  const cerrarModal = (): void => {
    setModalVisible(false);
  };

  const guardarDireccion = (): void => {
    const aliasLimpio: string = alias.trim();
    const detalleLimpio: string = detalle.trim();
    let errorAlias: string | undefined;
    if (aliasLimpio.length < 2) {
      errorAlias = 'Poné un alias de al menos 2 caracteres (ej. Casa).';
    } else if (aliasLimpio.length > 30) {
      errorAlias = 'El alias puede tener hasta 30 caracteres.';
    }
    let errorDetalle: string | undefined;
    if (detalleLimpio.length < 5) {
      errorDetalle = 'Escribí la dirección completa (mínimo 5 caracteres).';
    }
    setAliasError(errorAlias);
    setDetalleError(errorDetalle);
    if (errorAlias || errorDetalle) return;
    const nuevaId: string = `d${Date.now()}`;
    setDirecciones((prev: DireccionMock[]) => [
      ...prev,
      {
        id: nuevaId,
        alias: aliasLimpio,
        detalle: detalleLimpio,
        esPrincipal: false,
      },
    ]);
    setSeleccionada(nuevaId);
    if (user) {
      void storage.saveCheckoutAddress(user.uid, {
        alias: aliasLimpio,
        detalle: detalleLimpio,
      });
    }
    setModalVisible(false);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12 }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          titulo="Direcciones"
          onBack={() => navigation.goBack()}
          backAccessibilityLabel="Volver al perfil"
          right={
            <TouchableOpacity
              style={styles.addButton}
              onPress={abrirModal}
              accessibilityRole="button"
              accessibilityLabel="Añadir dirección"
            >
              <Ionicons name="add" size={18} color={colors.white} />
              <Text style={styles.addText}>Añadir</Text>
            </TouchableOpacity>
          }
        />

        {direcciones.map((d) => {
          const activa: boolean = seleccionada === d.id;
          return (
            <SelectableCard
              key={d.id}
              activo={activa}
              icono="location-outline"
              onPress={() => {
                setSeleccionada(d.id);
                if (user) {
                  void storage.saveCheckoutAddress(user.uid, {
                    alias: d.alias,
                    detalle: d.detalle,
                  });
                }
              }}
              accessibilityLabel={`Usar dirección ${d.alias}`}
            >
              <View style={styles.aliasRow}>
                <Text style={styles.alias}>{d.alias}</Text>
                {d.esPrincipal ? (
                  <View style={styles.principalBadge}>
                    <Text style={styles.principalText}>Principal</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.detalle} numberOfLines={2}>
                {d.detalle}
              </Text>
            </SelectableCard>
          );
        })}
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={cerrarModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Nueva dirección</Text>
            <FormField
              label="Alias"
              value={alias}
              onChangeText={setAlias}
              placeholder="Ej. Casa, Trabajo"
              error={aliasError}
              autoCapitalize="words"
            />
            <FormField
              label="Dirección"
              value={detalle}
              onChangeText={setDetalle}
              placeholder="Ej. Av. Arequipa 2450, Lima"
              error={detalleError}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={cerrarModal}
                accessibilityRole="button"
                accessibilityLabel="Cancelar"
              >
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={guardarDireccion}
                accessibilityRole="button"
                accessibilityLabel="Guardar dirección"
              >
                <Text style={styles.saveText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function makeStyles(c: Colors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.background },
    container: { flexGrow: 1, gap: 10, padding: 16, backgroundColor: c.background },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 12,
      backgroundColor: c.primary,
    },
    addText: { color: c.white, fontSize: 13, fontWeight: '800' },

    aliasRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    alias: { color: c.textPrimary, fontSize: 16, fontWeight: '800' },
    principalBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
      backgroundColor: c.primarySoft,
    },
    principalText: { color: c.primary, fontSize: 11, fontWeight: '800' },
    detalle: { color: c.textMuted, fontSize: 13 },

    modalOverlay: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      backgroundColor: 'rgba(15, 23, 42, 0.45)',
    },
    modalCard: {
      width: '100%',
      gap: 16,
      padding: 20,
      borderRadius: 16,
      backgroundColor: c.surface,
    },
    modalTitle: { color: c.textPrimary, fontSize: 17, fontWeight: '800' },
    modalActions: { flexDirection: 'row', gap: 10 },
    cancelButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    cancelText: { color: c.textMuted, fontSize: 14, fontWeight: '700' },
    saveButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
      backgroundColor: c.primary,
    },
    saveText: { color: c.white, fontSize: 14, fontWeight: '800' },
  });
}
