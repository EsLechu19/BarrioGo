import { useMemo, useState } from 'react';
import { StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { HorarioDia } from '../../types/Negocio';
import { useColors } from '../../context/ThemeContext';
import type { Colors } from '../../styles/colors';

// Editor del horario semanal. Guarda el estado interno y avisa al padre con
// `onChange` para que Mi Local lo persista con actualizarNegocio().
type DiaEditor = {
  dia: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  nombre: string;
  activo: boolean;
  apertura: string;
  cierre: string;
};

const HORA_REGEX: RegExp = /^([01]?\d|2[0-3]):[0-5]\d$/;

// Orden de visualización: lunes a domingo (dia = Date.getDay()).
const DIAS: { dia: DiaEditor['dia']; nombre: string }[] = [
  { dia: 1, nombre: 'Lunes' },
  { dia: 2, nombre: 'Martes' },
  { dia: 3, nombre: 'Miércoles' },
  { dia: 4, nombre: 'Jueves' },
  { dia: 5, nombre: 'Viernes' },
  { dia: 6, nombre: 'Sábado' },
  { dia: 0, nombre: 'Domingo' },
];

// Parte el horario guardado (o vacío) en las 7 filas del editor.
function aEditor(horario: HorarioDia[] | undefined): DiaEditor[] {
  return DIAS.map(({ dia, nombre }) => {
    const franja = horario?.find((f) => f.dia === dia);
    return {
      dia,
      nombre,
      activo: franja !== undefined,
      apertura: franja?.apertura ?? '11:00',
      cierre: franja?.cierre ?? '22:00',
    };
  });
}

// Convierte las filas del editor en HorarioDia[] (solo días activos con
// formato válido). Se notifica al padre con esto: lo inválido no se guarda.
export function editorAHorario(dias: DiaEditor[]): HorarioDia[] {
  return dias
    .filter((d) => d.activo && HORA_REGEX.test(d.apertura.trim()) && HORA_REGEX.test(d.cierre.trim()))
    .map((d) => ({ dia: d.dia, apertura: d.apertura.trim(), cierre: d.cierre.trim() }));
}

type Props = {
  horario?: HorarioDia[];
  // Se llama (con solo los días activos y horas válidas) en cada cambio.
  onChange?: (horario: HorarioDia[]) => void;
};

export function HorarioEditor({ horario, onChange }: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [dias, setDias] = useState<DiaEditor[]>(() => aEditor(horario));

  // Actualiza el estado interno y refleja el horario válido en el padre.
  function aplicar(next: DiaEditor[]): void {
    setDias(next);
    onChange?.(editorAHorario(next));
  }

  function setActivo(dia: DiaEditor['dia'], activo: boolean): void {
    aplicar(dias.map((d) => (d.dia === dia ? { ...d, activo } : d)));
  }

  function setHora(dia: DiaEditor['dia'], campo: 'apertura' | 'cierre', valor: string): void {
    aplicar(dias.map((d) => (d.dia === dia ? { ...d, [campo]: valor } : d)));
  }

  function horaInvalida(valor: string): boolean {
    return valor.trim() !== '' && !HORA_REGEX.test(valor.trim());
  }

  return (
    <View style={styles.wrap}>
      {dias.map((d) => (
        <View key={d.dia} style={styles.diaCard}>
          <View style={styles.diaTop}>
            <Text style={[styles.diaNombre, !d.activo && styles.diaNombreOff]}>{d.nombre}</Text>
            <Switch
              value={d.activo}
              onValueChange={(valor) => setActivo(d.dia, valor)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
              ios_backgroundColor={colors.border}
              accessibilityRole="switch"
              accessibilityLabel={`${d.nombre} ${d.activo ? 'abierto' : 'cerrado'}`}
            />
          </View>
          {d.activo ? (
            <View style={styles.horasRow}>
              <View style={styles.horaCampo}>
                <Text style={styles.horaLabel}>Apertura</Text>
                <TextInput
                  value={d.apertura}
                  onChangeText={(valor) => setHora(d.dia, 'apertura', valor)}
                  placeholder="11:00"
                  placeholderTextColor={colors.textPlaceholder}
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                  style={[styles.horaInput, horaInvalida(d.apertura) && styles.horaInputError]}
                  accessibilityLabel={`Hora de apertura del ${d.nombre}`}
                />
              </View>
              <Text style={styles.guion}>–</Text>
              <View style={styles.horaCampo}>
                <Text style={styles.horaLabel}>Cierre</Text>
                <TextInput
                  value={d.cierre}
                  onChangeText={(valor) => setHora(d.dia, 'cierre', valor)}
                  placeholder="22:00"
                  placeholderTextColor={colors.textPlaceholder}
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                  style={[styles.horaInput, horaInvalida(d.cierre) && styles.horaInputError]}
                  accessibilityLabel={`Hora de cierre del ${d.nombre}`}
                />
              </View>
            </View>
          ) : (
            <Text style={styles.cerradoTexto}>Cerrado este día</Text>
          )}
          {d.activo && (horaInvalida(d.apertura) || horaInvalida(d.cierre)) ? (
            <Text style={styles.errorText}>Formato inválido: usá HH:mm (ej. 11:00)</Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

function makeStyles(c: Colors) {
  return StyleSheet.create({
    wrap: { gap: 10 },
    diaCard: {
      gap: 8,
      padding: 12,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      backgroundColor: c.surface,
    },
    diaTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    diaNombre: { color: c.textPrimary, fontSize: 15, fontWeight: '700' },
    diaNombreOff: { color: c.textMuted },
    horasRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
    horaCampo: { flex: 1, gap: 4 },
    horaLabel: { color: c.textMuted, fontSize: 12, fontWeight: '600' },
    horaInput: {
      height: 42,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 10,
      backgroundColor: c.background,
      fontSize: 15,
      color: c.textPrimary,
      textAlign: 'center',
    },
    horaInputError: { borderColor: c.error },
    guion: { color: c.textMuted, fontSize: 16, fontWeight: '700', paddingBottom: 10 },
    cerradoTexto: { color: c.textMuted, fontSize: 13, fontStyle: 'italic' },
    errorText: { color: c.error, fontSize: 12, fontWeight: '600' },
  });
}
