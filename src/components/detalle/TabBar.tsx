import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../styles/colors';

// Barra de pestañas del detalle: Menú / Información / Opiniones.
export type Tab = 'menu' | 'info' | 'reviews';

type Props = {
  tab: Tab;
  onCambiar: (tab: Tab) => void;
};

export function TabBar({ tab, onCambiar }: Props) {
  return (
    <View style={styles.contentMenu}>
      <TouchableOpacity style={styles.tabButton} onPress={() => onCambiar('menu')}>
        <Text style={[styles.tabText, tab === 'menu' && styles.tabTextActive]}>
          Menú
        </Text>
        <View
          style={[styles.tabUnderline, tab === 'menu' && styles.tabUnderlineActive]}
        />
      </TouchableOpacity>
      <TouchableOpacity style={styles.tabButton} onPress={() => onCambiar('info')}>
        <Text style={[styles.tabText, tab === 'info' && styles.tabTextActive]}>
          Información
        </Text>
        <View
          style={[styles.tabUnderline, tab === 'info' && styles.tabUnderlineActive]}
        />
      </TouchableOpacity>
      <TouchableOpacity style={styles.tabButton} onPress={() => onCambiar('reviews')}>
        <Text style={[styles.tabText, tab === 'reviews' && styles.tabTextActive]}>
          Opiniones
        </Text>
        <View
          style={[
            styles.tabUnderline,
            tab === 'reviews' && styles.tabUnderlineActive,
          ]}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  contentMenu: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'center',
    gap: 8,
    height: 56,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabButton: {
    flex: 1,
    maxWidth: 130,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabText: { color: colors.textMuted, fontSize: 16, fontWeight: '600' },
  tabTextActive: { color: colors.primary, fontWeight: '800' },
  tabUnderline: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 3,
    borderRadius: 2,
  },
  tabUnderlineActive: { backgroundColor: colors.primary },
});
