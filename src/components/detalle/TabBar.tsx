import { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useColors } from '../../context/ThemeContext';
import type { Colors } from '../../styles/colors';

// Barra de pestañas del detalle: Menú / Información / Opiniones.
export type Tab = 'menu' | 'info' | 'reviews';

type Props = {
  tab: Tab;
  onCambiar: (tab: Tab) => void;
};

export function TabBar({ tab, onCambiar }: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
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

function makeStyles(c: Colors) {
  return StyleSheet.create({
    contentMenu: {
      flexDirection: 'row',
      alignItems: 'stretch',
      justifyContent: 'center',
      gap: 8,
      height: 56,
      paddingHorizontal: 16,
      backgroundColor: c.surface,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    tabButton: {
      flex: 1,
      maxWidth: 130,
      height: 56,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    tabText: { color: c.textMuted, fontSize: 16, fontWeight: '600' },
    tabTextActive: { color: c.primary, fontWeight: '800' },
    tabUnderline: {
      position: 'absolute',
      bottom: -1,
      left: 0,
      right: 0,
      height: 3,
      borderRadius: 2,
    },
    tabUnderlineActive: { backgroundColor: c.primary },
  });
}
