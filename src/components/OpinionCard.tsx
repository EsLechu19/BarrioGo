import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../styles/colors';
import { Opinion } from '../types/Opinion';
import { fechaCorta } from '../utils/fechas';
import { inicialDe } from '../utils/usuario';

type Props = {
  opinion: Opinion;
};

export function OpinionCard({ opinion }: Props) {
  const inicial: string = inicialDe(opinion.nombre);
  return (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{inicial}</Text>
      </View>
      <View style={styles.info}>
        <View style={styles.topRow}>
          <Text style={styles.nombre} numberOfLines={1}>
            {opinion.nombre}
          </Text>
          <Text style={styles.fecha}>{fechaCorta(opinion.fecha)}</Text>
        </View>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Ionicons
              key={n}
              name={n <= opinion.estrellas ? 'star' : 'star-outline'}
              size={14}
              color={colors.rating}
            />
          ))}
        </View>
        <Text style={styles.texto}>{opinion.texto}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.primary, fontSize: 16, fontWeight: '800' },
  info: { flex: 1, gap: 4 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  nombre: { color: colors.textPrimary, fontSize: 14, fontWeight: '800', flex: 1 },
  fecha: { color: colors.textMuted, fontSize: 12 },
  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  texto: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
});
