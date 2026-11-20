import { negociosMock } from '../data/negociosMock';
import { HorarioDia, Negocio } from '../types/Negocio';

// Texto del envío para cards/detalle: "Envío gratis" si aplica, "Envío S/X.XX"
// si tiene costo, o null si no cobra envío. Consistente en toda la app.
export function textoEnvio(negocio: Negocio): string | null {
  if (negocio.envioGratis) return 'Envío gratis';
  const costo: number | undefined = negocio.costoEnvio;
  if (typeof costo === 'number' && Number.isFinite(costo) && costo > 0) {
    return `Envío S/${costo.toFixed(2)}`;
  }
  return null;
}

// Costo de envío a cobrar en el checkout (0 si es gratis o sin costo).
export function costoEnvioANegocio(negocio: Negocio | null | undefined): number {
  if (!negocio || negocio.envioGratis) return 0;
  const costo: number | undefined = negocio.costoEnvio;
  return typeof costo === 'number' && Number.isFinite(costo) && costo > 0 ? costo : 0;
}


// Nombre del negocio a partir de su id usando el catálogo local (mock).
// Devuelve un texto genérico si no lo encuentra.
export function nombreRestaurante(negocioId: string): string {
  return negociosMock.find((n) => n.id === negocioId)?.nombre ?? 'Restaurante';
}

// Lima es UTC-5 todo el año (sin horario de verano). La hora se calcula a
// mano porque Hermes en Android no garantiza Intl/timeZone completo.
const LIMA_OFFSET_MIN = -5 * 60;

interface HoraLima {
  minutoDelDia: number; // 0..1439
  diaSemana: 0 | 1 | 2 | 3 | 4 | 5 | 6;
}

function horaLima(ahora: Date): HoraLima {
  const lima = new Date(ahora.getTime() + LIMA_OFFSET_MIN * 60_000);
  return {
    minutoDelDia: lima.getUTCHours() * 60 + lima.getUTCMinutes(),
    diaSemana: lima.getUTCDay() as HoraLima['diaSemana'],
  };
}

// "HH:mm" -> minutos desde medianoche. Formato inválido => null.
function parsearHora(hora: string): number | null {
  const match: RegExpMatchArray | null = hora.trim().match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

/**
 * Estado EFECTIVO del negocio en `ahora` (por defecto, ahora mismo, hora de Lima).
 * 1. Ignora abiertoManual completamente; el horario semanal es la única fuente.
 * 2. Si el horario no existe o está vacío, el negocio está cerrado.
 * 3. Si no hay entrada para el día actual en el horario, está cerrado.
 * 4. Se usa hora de Lima; no se revisa el día anterior ni madrugadas.
 * 5. Para horarios normales: apertura <= horaActual < cierre.
 * 6. Si el cierre es 00:00, abierto desde apertura hasta antes de medianoche.
 * 7. Si Apertura > Cierre y no es el caso 00:00, cerrado por seguridad.
 */
export function estaAbierto(negocio: Negocio, ahora: Date = new Date()): boolean {
  // 1. Ignorar abiertoManual completamente.

  // 2. Si el horario no existe o está vacío, el negocio está cerrado.
  const horario: HorarioDia[] = negocio.horario ?? [];
  if (horario.length === 0) return false;

  // 3. Obtener hora actual en Lima.
  const { minutoDelDia, diaSemana } = horaLima(ahora);

  // 4. Buscar la franja del día actual en el horario.
  const franja = horario.find((f) => f.dia === diaSemana);

  // 6. Si no hay entrada para el día actual, está cerrado.
  if (!franja) return false;

  // 7. Parsear apertura y cierre a minutos.
  const apertura = parsearHora(franja.apertura);
  const cierre = parsearHora(franja.cierre);

  // Si horas inválidas → cerrado.
  if (apertura === null || cierre === null) return false;

  // 8. Si el cierre es 00:00, considerar abierto desde apertura hasta antes de medianoche.
  if (cierre === 0) return minutoDelDia >= apertura;

  // 9. Si apertura > cierre y no es el caso 00:00, cerrar por seguridad.
  if (apertura > cierre) return false;

  // 10. Horario normal: apertura <= horaActual < cierre.
  return minutoDelDia >= apertura && minutoDelDia < cierre;
}

/**
 * Texto "Abre a las HH:mm" / "Abre mañana a las HH:mm" / "Abre el <día> a
 * las HH:mm" para un negocio cerrado. `null` si está abierto o no hay
 * horario válido en los próximos 7 días.
 */
export function proximaAperturaTexto(negocio: Negocio, ahora: Date = new Date()): string | null {
  if (estaAbierto(negocio, ahora)) return null;
  const horario: HorarioDia[] = negocio.horario ?? [];

  const { diaSemana } = horaLima(ahora);
  const DIAS: string[] = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

  for (let salto = 0; salto <= 7; salto++) {
    const dia: number = (diaSemana + salto) % 7;
    const franjas: HorarioDia[] = horario.filter(
      (f) => f.dia === dia && parsearHora(f.apertura) !== null,
    );
    if (franjas.length === 0) continue;

    // Primera apertura del día en orden cronológico.
    franjas.sort((a, b) => (parsearHora(a.apertura) ?? 0) - (parsearHora(b.apertura) ?? 0));
    const aperturaTxt: string = franjas[0].apertura;

    // Hoy solo cuenta si la apertura ya pasó: si ya abrió y sigue cerrado,
    // hay que esperar la próxima apertura (quizá mañana).
    if (salto === 0) {
      const ahoraMin = horaLima(ahora).minutoDelDia;
      const aperturaMin = parsearHora(aperturaTxt) ?? 0;
      if (aperturaMin <= ahoraMin) continue; // ya abrió hoy y no está en franja => mirar mañana
      return `Abre a las ${aperturaTxt}`;
    }
    if (salto === 1) return `Abre mañana a las ${aperturaTxt}`;
    return `Abre el ${DIAS[dia]} a las ${aperturaTxt}`;
  }
  return null;
}

/**
 * Resumen corto del horario para mostrar en el panel del dueño:
 * "Lun 11:00–22:00 · Mar 11:00–22:00 … · Dom cerrado", o null si no hay.
 */
export function resumenHorario(negocio: Negocio): string | null {
  const horario: HorarioDia[] = negocio.horario ?? [];
  if (horario.length === 0) return null;
  const DIAS_CORTO: string[] = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const porDia: Map<number, HorarioDia[]> = new Map();
  for (const franja of horario) {
    const lista = porDia.get(franja.dia) ?? [];
    lista.push(franja);
    porDia.set(franja.dia, lista);
  }

  const partes: string[] = [];
  // De lunes a domingo, en orden de día.
  for (let paso = 1; paso <= 7; paso++) {
    const d: number = paso % 7;
    const franjas = porDia.get(d);
    if (!franjas || franjas.length === 0) {
      partes.push(`${DIAS_CORTO[d]} cerrado`);
      continue;
    }
    const rango: string = franjas
      .slice()
      .sort((a, b) => (parsearHora(a.apertura) ?? 0) - (parsearHora(b.apertura) ?? 0))
      .map((f) => `${f.apertura}–${f.cierre}`)
      .join(', ');
    partes.push(`${DIAS_CORTO[d]} ${rango}`);
  }
  return partes.join(' · ');
}
