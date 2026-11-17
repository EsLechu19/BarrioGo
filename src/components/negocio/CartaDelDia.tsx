import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Producto } from '../../types/Producto';
import { SeccionCard } from '../SeccionCard';
import { useColors } from '../../context/ThemeContext';
import type { Colors } from '../../styles/colors';
import {
  DIAS_SEMANA_CORTO,
  SECCIONES_CARTA,
  SeccionCarta,
  agruparPorSeccion,
  esSeccionCarta,
} from '../../utils/cartaDiaria';

// Orden de la semana para el planner: lunes → domingo.
const SEMANA: number[] = [1, 2, 3, 4, 5, 6, 0];

// Planner de la carta diaria: por día de la semana, qué platos salen.
// Cada toggle persiste al instante vía api.ts (el padre maneja el guardado).
type Props = {
  menu: Producto[];
  guardandoId: string | null;
  onToggleDia: (producto: Producto, dia: number) => void;
};

export function CartaDelDia({ menu, guardandoId, onToggleDia }: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [diaSel, setDiaSel] = useState<number>(new Date().getDay());

  // Plato activo en el día seleccionado: sin campo (todos) = siempre.
  const activoEnDia = (p: Producto, dia: number): boolean =>
    !p.diasSemana || p.diasSemana.length === 0 || p.diasSemana.includes(dia);

  const grupos = useMemo(() => agruparPorSeccion(menu), [menu]);
  const hoy: number = new Date().getDay();

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <Text style={styles.titulo}>Carta del día</Text>
      <Text style={styles.subtitulo}>
        Elegí el día y encendé los platos que salen. Se guarda solo.
      </Text>

      {/* Selector de día L-D, con "Hoy" resaltado */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.diasScroll}
        contentContainerStyle={styles.diasRow}
      >
        {SEMANA.map((dia) => {
          const activa: boolean = diaSel === dia;
          return (
            <TouchableOpacity
              key={dia}
              style={[styles.diaChip, activa && styles.diaChipActivo]}
              onPress={() => setDiaSel(dia)}
              accessibilityRole="button"
              accessibilityState={{ selected: activa }}
              accessibilityLabel={`Ver carta del ${DIAS_SEMANA_CORTO[dia]}`}
            >
              <Text style={[styles.diaTexto, activa && styles.diaTextoActivo]}>
                {DIAS_SEMANA_CORTO[dia]}
              </Text>
              {dia === hoy ? (
                <Text style={[styles.hoyTexto, activa && styles.hoyTextoActivo]}>Hoy</Text>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {menu.length === 0 ? (
        <Text style={styles.vacio}>
          Todavía no tenés platos. Añadí platos en Mi menú para armar la carta.
        </Text>
      ) : (
        SECCIONES_CARTA.filter((sec) => grupos[sec].length > 0).map((sec: SeccionCarta) => (
          <SeccionCard key={sec} titulo={sec} icono="fast-food-outline">
            {grupos[sec].map((item) => {
              const activa: boolean = activoEnDia(item, diaSel);
              const guardando: boolean = guardandoId === item.id;
              return (
                <View key={item.id} style={styles.filaPlato}>
                  <View style={styles.platoInfo}>
                    <Text style={styles.platoNombre} numberOfLines={1}>
                      {item.nombre}
                    </Text>
                    <Text style={styles.platoSeccion}>
                      {esSeccionCarta(item.categoriaProducto) ? item.categoriaProducto : 'Menú'}
                    </Text>
                  </View>
                  <Switch
                    value={activa}
                    disabled={guardando}
                    onValueChange={() => onToggleDia(item, diaSel)}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={colors.surface}
                    accessibilityLabel={`${activa ? 'Quitar' : 'Agregar'} ${item.nombre} el ${DIAS_SEMANA_CORTO[diaSel]}`}
                  />
                </View>
              );
            })}
          </SeccionCard>
        ))
      )}
    </ScrollView>
  );
}

function makeStyles(c: Colors) {
  return StyleSheet.create({
    scroll: { gap: 10, paddingBottom: 120 },
    titulo: { color: c.textPrimary, fontSize: 18, fontWeight: '800' },
    subtitulo: { color: c.textMuted, fontSize: 13, lineHeight: 18 },
    diasScroll: { flexGrow: 0, marginHorizontal: -16, paddingHorizontal: 16 },
    diasRow: { gap: 8, paddingVertical: 4, paddingRight: 16 },
    diaChip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      alignItems: 'center',
    },
    diaChipActivo: { backgroundColor: c.primary, borderColor: c.primary },
    diaTexto: { color: c.textPrimary, fontSize: 14, fontWeight: '800' },
    diaTextoActivo: { color: c.white },
    hoyTexto: { color: c.textMuted, fontSize: 10, fontWeight: '700' },
    hoyTextoActivo: { color: c.white },
    vacio: { color: c.textMuted, fontSize: 14, textAlign: 'center', paddingVertical: 24 },
    filaPlato: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      paddingVertical: 8,
    },
    platoInfo: { flex: 1, gap: 2 },
    platoNombre: { color: c.textPrimary, fontSize: 15, fontWeight: '700' },
    platoSeccion: { color: c.textMuted, fontSize: 12 },
  });
}
