import { useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OpinionCard } from '../OpinionCard';
import {
  Estrellas,
  MAX_TEXTO_OPINION,
  Opinion,
} from '../../types/Opinion';
import { useColors } from '../../context/ThemeContext';
import type { Colors } from '../../styles/colors';

const ETIQUETA_ESTRELLAS: Record<number, string> = {
  0: 'Tocá una estrella',
  1: 'Malo',
  2: 'Regular',
  3: 'Bueno',
  4: 'Muy bueno',
  5: '¡Excelente!',
};

// Pestaña Opiniones: resumen de rating, lista de opiniones y formulario visual.
type Props = {
  opiniones: Opinion[];
  promedio: number;
  distribucion: { nivel: Estrellas; cantidad: number }[];
  estrellas: number;
  texto: string;
  puedePublicar: boolean;
  onEstrellasChange: (n: number) => void;
  onTextoChange: (t: string) => void;
  onPublicar: () => void;
};

export function ReviewsTab({
  opiniones,
  promedio,
  distribucion,
  estrellas,
  texto,
  puedePublicar,
  onEstrellasChange,
  onTextoChange,
  onPublicar,
}: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      {/* Resumen rating (promedio local del mock) */}
      <View style={styles.reviewSummary}>
        <Text style={styles.ratingBig}>
          {opiniones.length > 0 ? `⭐ ${promedio.toFixed(1)}` : '⭐ —'}
        </Text>
        <Text style={styles.meta}>
          {opiniones.length === 0
            ? 'Sin opiniones todavía'
            : `${opiniones.length} ${opiniones.length === 1 ? 'opinión de vecinos' : 'opiniones de vecinos'}`}
        </Text>
        {opiniones.length > 0 ? (
          <View style={styles.distBlock}>
            {distribucion.map(({ nivel, cantidad }) => {
              const pct: number =
                opiniones.length > 0 ? cantidad / opiniones.length : 0;
              return (
                <View key={nivel} style={styles.distRow}>
                  <Text style={styles.distLabel}>{nivel}★</Text>
                  <View style={styles.distTrack}>
                    <View style={[styles.distFill, { flex: pct }]} />
                    <View style={{ flex: 1 - pct }} />
                  </View>
                  <Text style={styles.distCount}>{cantidad}</Text>
                </View>
              );
            })}
          </View>
        ) : null}
      </View>
      {/* Lista de opiniones o vacío */}
      {opiniones.length === 0 ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIcon}>
            <Ionicons name="chatbubbles-outline" size={30} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Aún no hay opiniones</Text>
          <Text style={styles.statusText}>
            Sé el primero en pedir y contar cómo te fue.
          </Text>
        </View>
      ) : (
        opiniones.map((opinion) => (
          <OpinionCard key={opinion.id} opinion={opinion} />
        ))
      )}
      {/* Formulario visual (solo diseño, no persiste) */}
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Dejá tu opinión</Text>
        <View style={styles.starsBox}>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((n) => {
              const activa: boolean = n <= estrellas;
              return (
                <TouchableOpacity
                  key={n}
                  style={[styles.starButton, activa && styles.starButtonActive]}
                  onPress={() => onEstrellasChange(n)}
                  hitSlop={4}
                  accessibilityRole="button"
                  accessibilityLabel={`Dar ${n} ${n === 1 ? 'estrella' : 'estrellas'}`}
                >
                  <Ionicons
                    name={activa ? 'star' : 'star-outline'}
                    size={26}
                    color={activa ? colors.white : colors.rating}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.starsLabel}>{ETIQUETA_ESTRELLAS[estrellas]}</Text>
        </View>
        <TextInput
          value={texto}
          onChangeText={onTextoChange}
          placeholder="Contá cómo te fue..."
          placeholderTextColor={colors.textPlaceholder}
          multiline
          maxLength={MAX_TEXTO_OPINION}
          style={styles.opinionInput}
        />
        <View style={styles.formFooter}>
          <Text style={styles.charCount}>
            {texto.trim().length}/{MAX_TEXTO_OPINION}
          </Text>
          <TouchableOpacity
            style={[styles.publishButton, !puedePublicar && styles.publishButtonDisabled]}
            onPress={onPublicar}
            disabled={!puedePublicar}
            accessibilityRole="button"
            accessibilityLabel="Publicar opinión"
          >
            <Text style={styles.publishText}>Publicar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

function makeStyles(c: Colors) {
  return StyleSheet.create({
    tabContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 20, gap: 12 },
    statusText: { color: c.textMuted, fontSize: 14, textAlign: 'center' },
    meta: { color: c.textMuted, fontSize: 13 },
    ratingBig: { color: c.textPrimary, fontSize: 22, fontWeight: '900' },
    reviewSummary: {
      alignItems: 'center',
      gap: 4,
      padding: 18,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      backgroundColor: c.surface,
    },
    distBlock: { width: '100%', gap: 6, marginTop: 8 },
    distRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    distLabel: { color: c.textMuted, fontSize: 12, fontWeight: '700', width: 24 },
    distTrack: {
      flex: 1,
      flexDirection: 'row',
      height: 8,
      borderRadius: 4,
      overflow: 'hidden',
      backgroundColor: c.background,
    },
    distFill: { backgroundColor: c.rating, borderRadius: 4 },
    distCount: { color: c.textMuted, fontSize: 12, width: 20, textAlign: 'right' },
    formCard: {
      gap: 10,
      padding: 14,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      backgroundColor: c.surface,
    },
    formTitle: { color: c.textPrimary, fontSize: 15, fontWeight: '800' },
    starsBox: {
      alignItems: 'center',
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 16,
      backgroundColor: c.primarySoft,
    },
    starsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
    starButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    starButtonActive: { backgroundColor: c.primary, borderColor: c.primary },
    starsLabel: { color: c.textPrimary, fontSize: 14, fontWeight: '800' },
    opinionInput: {
      minHeight: 80,
      padding: 12,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      backgroundColor: c.background,
      color: c.textPrimary,
      fontSize: 14,
      textAlignVertical: 'top',
    },
    formFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    charCount: { color: c.textMuted, fontSize: 12 },
    publishButton: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: c.primary,
    },
    publishButtonDisabled: { opacity: 0.4 },
    publishText: { color: c.white, fontSize: 14, fontWeight: '700' },
    emptyCard: {
      alignItems: 'center',
      gap: 8,
      padding: 24,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: c.border,
      borderRadius: 16,
      backgroundColor: c.surface,
    },
    emptyIcon: {
      width: 60,
      height: 60,
      borderRadius: 30,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: c.primarySoft,
    },
    emptyTitle: { color: c.textPrimary, fontSize: 16, fontWeight: '800' },
  });
}
