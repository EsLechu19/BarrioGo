import { useMemo, useState } from 'react';
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
import { useColors } from '../context/ThemeContext';
import type { Colors } from '../styles/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Ayuda'>;

const PREGUNTAS: { pregunta: string; respuesta: string }[] = [
  {
    pregunta: '¿Cómo sigo mi pedido?',
    respuesta: 'Entrá a Pedidos, tocá tu pedido y mirá su estado en tiempo real: pendiente, confirmado, en camino y entregado.',
  },
  {
    pregunta: '¿Cómo pago mi pedido?',
    respuesta: 'Por ahora pagás al recibir (efectivo, Yape o tarjeta). Elegí tu método en Perfil → Métodos de pago.',
  },
  {
    pregunta: '¿Puedo pedir sin crear cuenta?',
    respuesta: 'Necesitás una cuenta para guardar tu carrito, tus favoritos y el historial de pedidos.',
  },
  {
    pregunta: '¿Qué hago si mi pedido no llega?',
    respuesta: 'Escribinos por WhatsApp o correo con tu número de pedido y lo resolvemos con el negocio.',
  },
];

export default function AyudaScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [abierta, setAbierta] = useState<number | null>(0);
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12 }]}>
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader
        titulo="Ayuda y soporte"
        onBack={() => navigation.goBack()}
        backAccessibilityLabel="Volver al perfil"
      />

      <View style={styles.card}>
        <View style={styles.supportIcon}>
          <Ionicons name="chatbubbles-outline" size={30} color={colors.primary} />
        </View>
        <Text style={styles.supportTitle}>¿Necesitás ayuda?</Text>
        <Text style={styles.supportSub}>
          Respondemos Lun–Sáb de 9:00 a 20:00.
        </Text>
        <View style={styles.supportRow}>
          <View style={styles.supportPill}>
            <Ionicons name="logo-whatsapp" size={16} color={colors.success} />
            <Text style={styles.supportPillText}>999 888 777</Text>
          </View>
          <View style={styles.supportPill}>
            <Ionicons name="mail-outline" size={16} color={colors.primary} />
            <Text style={styles.supportPillText}>hola@barriogo.pe</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Preguntas frecuentes</Text>
      <View style={styles.card}>
        {PREGUNTAS.map((p, i) => {
          const expandida: boolean = abierta === i;
          return (
            <View key={p.pregunta}>
              {i > 0 ? <View style={styles.divider} /> : null}
              <TouchableOpacity
                style={styles.faqRow}
                onPress={() => setAbierta(expandida ? null : i)}
                accessibilityRole="button"
                accessibilityLabel={p.pregunta}
              >
                <Text style={styles.faqQ}>{p.pregunta}</Text>
                <Ionicons
                  name={expandida ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={colors.textPlaceholder}
                />
              </TouchableOpacity>
              {expandida ? (
                <Text style={styles.faqA}>{p.respuesta}</Text>
              ) : null}
            </View>
          );
        })}
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
    supportIcon: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: c.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
      marginTop: 16,
    },
    supportTitle: {
      color: c.textPrimary,
      fontSize: 17,
      fontWeight: '800',
      textAlign: 'center',
      marginTop: 8,
    },
    supportSub: {
      color: c.textMuted,
      fontSize: 13,
      textAlign: 'center',
      marginBottom: 8,
    },
    supportRow: {
      flexDirection: 'row',
      gap: 8,
      justifyContent: 'center',
      paddingBottom: 16,
    },
    supportPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 999,
      backgroundColor: c.background,
      borderWidth: 1,
      borderColor: c.border,
    },
    supportPillText: { color: c.textPrimary, fontSize: 13, fontWeight: '700' },

    sectionTitle: { color: c.textPrimary, fontSize: 17, fontWeight: '800', marginTop: 4 },
    faqRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 10,
      paddingVertical: 13,
    },
    faqQ: { flex: 1, color: c.textPrimary, fontSize: 15, fontWeight: '700' },
    faqA: {
      color: c.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      paddingHorizontal: 10,
      paddingBottom: 13,
    },
    divider: { height: 1, marginLeft: 10, backgroundColor: c.border },
  });
}
