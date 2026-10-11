import { StyleSheet, TouchableOpacity, View } from 'react-native';
import type { ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/colors';

type IconoNombre = React.ComponentProps<typeof Ionicons>['name'];

// Card seleccionable (direcciones / métodos de pago): caja de icono que se
// pinta cuando está activa, contenido libre y check a la derecha.
type Props = {
  activo: boolean;
  icono: IconoNombre;
  onPress: () => void;
  accessibilityLabel: string;
  children: ReactNode;
};

export function SelectableCard({
  activo,
  icono,
  onPress,
  accessibilityLabel,
  children,
}: Props) {
  return (
    <TouchableOpacity
      style={[styles.card, activo && styles.cardActive]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <View style={[styles.iconBox, activo && styles.iconBoxActive]}>
        <Ionicons
          name={icono}
          size={22}
          color={activo ? colors.white : colors.primary}
        />
      </View>
      <View style={styles.cardInfo}>{children}</View>
      <Ionicons
        name={activo ? 'checkmark-circle' : 'ellipse-outline'}
        size={24}
        color={activo ? colors.primary : colors.textPlaceholder}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  cardActive: { borderColor: colors.primary },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxActive: { backgroundColor: colors.primary },
  cardInfo: { flex: 1, gap: 2 },
});
