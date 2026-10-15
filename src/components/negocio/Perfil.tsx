import { useMemo } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Negocio } from '../../types/Negocio';
import { useColors } from '../../context/ThemeContext';
import type { Colors } from '../../styles/colors';

// Encabezado del panel del negocio: foto + nombre + dirección + botón Editar.
type Props = {
  negocio: Negocio | null;
  negocioId: string | null;
  onEditar: () => void;
};

export function Perfil({ negocio, negocioId, onEditar }: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.heroCard}>
      {negocio?.imagen?.trim() ? (
        <Image source={{ uri: negocio.imagen }} style={styles.heroPhoto} />
      ) : (
        <View style={[styles.heroPhoto, styles.heroPhotoPlaceholder]}>
          <Ionicons name="storefront-outline" size={30} color={colors.primary} />
        </View>
      )}
      <View style={styles.heroText}>
        <Text style={styles.heroTitle} numberOfLines={1}>
          {negocio?.nombre ?? 'Mi negocio'}
        </Text>
        <Text style={styles.heroSub} numberOfLines={1}>
          {negocio?.direccion?.trim()
            ? negocio.direccion
            : `Local ${negocioId} • Panel del negocio`}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.editButton}
        onPress={onEditar}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Editar mi local"
      >
        <Ionicons name="create-outline" size={18} color={colors.primary} />
        <Text style={styles.editText}>Editar</Text>
      </TouchableOpacity>
    </View>
  );
}

function makeStyles(c: Colors) {
  return StyleSheet.create({
    heroCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      backgroundColor: c.surface,
    },
    heroPhoto: { width: 56, height: 56, borderRadius: 28, backgroundColor: c.border },
    heroPhotoPlaceholder: {
      backgroundColor: c.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroText: { flex: 1, gap: 2 },
    heroTitle: { color: c.textPrimary, fontSize: 19, fontWeight: '900' },
    heroSub: { color: c.textMuted, fontSize: 13 },
    editButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
    },
    editText: { color: c.primary, fontSize: 14, fontWeight: '700' },
  });
}
