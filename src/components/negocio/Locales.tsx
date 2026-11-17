import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Negocio } from '../../types/Negocio';
import { estaAbierto } from '../../utils/negocios';
import { SeccionCard } from '../SeccionCard';
import { InfoBanner } from '../InfoBanner';
import { useColors } from '../../context/ThemeContext';
import type { Colors } from '../../styles/colors';

type Props = {
  negocio: Negocio | null;
  mostrarAviso: boolean;
  onAnadir: () => void;
};

export function Locales({ negocio, mostrarAviso, onAnadir }: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  // Estado efectivo del local principal (horario + override del dueño).
  const principalAbierto: boolean = negocio ? estaAbierto(negocio) : false;
  return (
    <ScrollView contentContainerStyle={styles.sectionScroll} showsVerticalScrollIndicator={false}>
      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Mis establecimientos</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={onAnadir}
          accessibilityRole="button"
          accessibilityLabel="Añadir establecimiento (diseño)"
        >
          <Ionicons name="add" size={18} color={colors.white} />
          <Text style={styles.addText}>Añadir</Text>
        </TouchableOpacity>
      </View>
      {mostrarAviso ? (
        <InfoBanner texto="Pronto: registrar otra sede para este negocio (solo diseño)." />
      ) : null}
      <SeccionCard
        titulo={negocio?.nombre ?? 'Mi negocio'}
        subtitulo={negocio?.direccion?.trim() ?? 'Dirección por confirmar'}
        foto={negocio?.imagen}
        icono="storefront-outline"
        badgeTexto="Principal"
        badgeColor={colors.primary}
        accionInferior={
          <View
            style={[
              styles.openRow,
              principalAbierto ? styles.openRowAbierto : styles.openRowCerrado,
            ]}
          >
            <View
              style={[
                styles.statusDot,
                principalAbierto ? styles.statusDotOpen : styles.statusDotCerrado,
              ]}
            />
            <Text
              style={[styles.estadoText, principalAbierto ? styles.doneText : styles.cerradoText]}
            >
              {principalAbierto ? 'Abierto ahora' : 'Cerrado ahora'}
            </Text>
          </View>
        }
      />
    </ScrollView>
  );
}

function makeStyles(c: Colors) {
  return StyleSheet.create({
    sectionScroll: { gap: 10, paddingBottom: 120 },
    sectionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    sectionTitle: { color: c.textPrimary, fontSize: 18, fontWeight: '800' },
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
    openRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 8,
      borderRadius: 12,
    },
    openRowAbierto: { backgroundColor: c.successSoft },
    openRowCerrado: { backgroundColor: c.surface, borderWidth: 1, borderColor: c.border },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    statusDotOpen: { backgroundColor: c.success },
    statusDotCerrado: { backgroundColor: c.textMuted },
    estadoText: { fontSize: 13, fontWeight: '700' },
    doneText: { color: c.success },
    cerradoText: { color: c.textMuted },
  });
}
