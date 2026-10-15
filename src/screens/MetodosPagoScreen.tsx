import { useEffect, useMemo, useState } from 'react';
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
import { InfoBanner } from '../components/InfoBanner';
import { SelectableCard } from '../components/SelectableCard';
import { useColors } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { storage } from '../services/storage';
import type { Colors } from '../styles/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'MetodosPago'>;

interface MetodoMock {
  id: string;
  nombre: string;
  detalle: string;
  icono: 'card-outline' | 'phone-portrait-outline' | 'cash-outline';
}

// TODO(back): métodos reales con pasarela (Yape/Plin/tarjeta) + Firestore.
const METODOS_MOCK: MetodoMock[] = [
  { id: 'm1', nombre: 'Efectivo', detalle: 'Pago al recibir', icono: 'cash-outline' },
  { id: 'm2', nombre: 'Yape', detalle: '999 888 777', icono: 'phone-portrait-outline' },
  { id: 'm3', nombre: 'Visa •• 4321', detalle: 'Vence 08/28', icono: 'card-outline' },
];

export default function MetodosPagoScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [seleccionado, setSeleccionado] = useState<string>('');
  const [aviso, setAviso] = useState<boolean>(false);
  const { user } = useAuth();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  useEffect(() => {
    const usuarioId: string | undefined = user?.uid;
    if (!usuarioId) return;
    let activa = true;
    void storage.loadCheckoutPayment(usuarioId).then((metodo) => {
      if (!activa) return;
      if (!metodo) {
        // Selección honesta: nada activo si no hay método guardado.
        setSeleccionado('');
        return;
      }
      const encontrado: MetodoMock | undefined = METODOS_MOCK.find(
        (item) => item.id === metodo.tipo && item.nombre === metodo.nombre,
      );
      setSeleccionado(encontrado?.id ?? '');
    });
    return () => {
      activa = false;
    };
  }, [user?.uid]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12 }]}>
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader
        titulo="Métodos de pago"
        onBack={() => navigation.goBack()}
        backAccessibilityLabel="Volver al perfil"
        right={
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setAviso(true)}
            accessibilityRole="button"
            accessibilityLabel="Añadir método de pago"
          >
            <Ionicons name="add" size={18} color={colors.white} />
            <Text style={styles.addText}>Añadir</Text>
          </TouchableOpacity>
        }
      />

      {aviso ? (
        <InfoBanner texto="Pronto: vincular tarjetas y billeteras reales." />
      ) : null}

      {METODOS_MOCK.map((m) => {
        const activo: boolean = seleccionado === m.id;
        return (
          <SelectableCard
            key={m.id}
            activo={activo}
            icono={m.icono}
            onPress={() => {
              setSeleccionado(m.id);
              if (user) {
                void storage.saveCheckoutPayment(user.uid, {
                  tipo: m.id,
                  nombre: m.nombre,
                });
              }
            }}
            accessibilityLabel={`Pagar con ${m.nombre}`}
          >
            <Text style={styles.nombre}>{m.nombre}</Text>
            <Text style={styles.detalle}>{m.detalle}</Text>
          </SelectableCard>
        );
      })}
    </ScrollView>
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
    nombre: { color: c.textPrimary, fontSize: 16, fontWeight: '800' },
    detalle: { color: c.textMuted, fontSize: 13 },
  });
}
