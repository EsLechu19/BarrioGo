import { useMemo } from 'react';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Negocio } from '../../types/Negocio';
import { estaAbierto } from '../../utils/negocios';
import { useColors } from '../../context/ThemeContext';
import type { Colors } from '../../styles/colors';

// Banner "Abrir / Cerrar": persiste el cambio en Firestore; si falla,
// el interruptor vuelve al estado anterior y se avisa con Alert.
type Props = {
  negocio: Negocio | null;
  // Estado forzado por el dueño (undefined = sigue el horario programado).
  overrideManual: boolean | undefined;
  // Puede devolver una promesa: los errores se muestran en un Alert.
  onToggle: (nuevoValor: boolean) => void | Promise<void>;
};

export function EstadoNegocioBanner({ negocio, overrideManual, onToggle }: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  // Estado efectivo con el override local ya aplicado (el negocio del panel
  // puede venir del getNegocioById y el override vive en la pantalla).
  const negocioConOverride: Negocio | null = useMemo(
    () => (negocio ? { ...negocio, abiertoManual: overrideManual } : null),
    [negocio, overrideManual],
  );
  const abierto: boolean = negocioConOverride ? estaAbierto(negocioConOverride) : false;

  async function aplicar(valor: boolean): Promise<void> {
    try {
      await onToggle(valor);
    } catch (e) {
      Alert.alert(
        'No se pudo guardar',
        e instanceof Error ? e.message : 'Intentá de nuevo.',
      );
    }
  }

  function handleToggle(valor: boolean): void {
    if (valor) {
      void aplicar(true);
      return;
    }
    // Cerrar tiene confirmación.
    Alert.alert('¿Seguro de cerrar negocio?', undefined, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar', style: 'destructive', onPress: () => void aplicar(false) },
    ]);
  }

  return (
    <View style={[styles.banner, abierto ? styles.bannerAbierto : styles.bannerCerrado]}>
      <View style={[styles.iconWrap, { backgroundColor: abierto ? colors.successSoft : colors.surface }]}>
        <Ionicons
          name={abierto ? 'storefront-outline' : 'lock-closed-outline'}
          size={20}
          color={abierto ? colors.success : colors.textMuted}
        />
      </View>
      <View style={styles.textos}>
        <Text style={[styles.titulo, { color: abierto ? colors.success : colors.textMuted }]}>
          {abierto ? 'Abierto ahora' : 'Cerrado ahora'}
        </Text>
      </View>
      <Switch
        value={abierto}
        onValueChange={handleToggle}
        trackColor={{ false: colors.border, true: colors.success }}
        thumbColor={colors.white}
        ios_backgroundColor={colors.border}
        accessibilityRole="switch"
        accessibilityLabel={abierto ? 'Cerrar mi negocio' : 'Abrir mi negocio'}
      />
    </View>
  );
}

function makeStyles(c: Colors) {
  return StyleSheet.create({
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 12,
      borderWidth: 1,
      borderRadius: 16,
    },
    bannerAbierto: { borderColor: c.success, backgroundColor: c.successSoft },
    bannerCerrado: { borderColor: c.border, backgroundColor: c.surface },
    iconWrap: {
      width: 38,
      height: 38,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    textos: { flex: 1, gap: 2 },
    titulo: { fontSize: 15, fontWeight: '800' },
  });
}
