import { CategoriaNegocio, Negocio } from '../types/Negocio';
import { Producto } from '../types/Producto';

// Carta diaria: solo los restaurantes (categoría comida_criolla) cambian de
// menú cada día. El resto de negocios ignora todo esto por completo.

// Combobox de categoría (registro y Mi local): valor + label visible.
export const CATEGORIAS_NEGOCIO: { valor: CategoriaNegocio; label: string }[] = [
  { valor: 'polleria', label: 'Pollería' },
  { valor: 'chifa', label: 'Chifa' },
  { valor: 'comida_criolla', label: 'Comida criolla' },
  { valor: 'broaster', label: 'Broaster' },
  { valor: 'anticuchos', label: 'Anticuchos' },
  { valor: 'cevicheria', label: 'Cevichería' },
  { valor: 'caldos', label: 'Caldos' },
  { valor: 'pizza', label: 'Pizza' },
  { valor: 'pasteleria', label: 'Pastelería' },
  { valor: 'sangucheria', label: 'Sanguchería' },
  { valor: 'jugueria', label: 'Juguería' },
  { valor: 'cafeteria', label: 'Cafetería' },
  { valor: 'otro', label: 'Otro' },
];

export function labelDeCategoria(cat: CategoriaNegocio): string {
  return CATEGORIAS_NEGOCIO.find((c) => c.valor === cat)?.label ?? cat;
}

export function esCategoriaNegocio(value: unknown): value is CategoriaNegocio {
  return (
    typeof value === 'string' &&
    CATEGORIAS_NEGOCIO.some((c) => c.valor === value)
  );
}

// Restaurante = carta diaria: el menú cambia cada día y se arma con
// 1 entrada + 1 comida a precio fijo del negocio (+ extras).
export function esRestaurante(
  n: Pick<Negocio, 'categoria' | 'categorias'>,
): boolean {
  const cats: CategoriaNegocio[] =
    n.categorias && n.categorias.length > 0
      ? n.categorias
      : n.categoria
        ? [n.categoria]
        : [];
  return cats.includes('comida_criolla');
}

// Secciones fijas de la carta (valores de categoriaProducto de los platos).
export const SECCIONES_CARTA = ['Entradas', 'Menú', 'Extras'] as const;
export type SeccionCarta = (typeof SECCIONES_CARTA)[number];

export function esSeccionCarta(value: unknown): value is SeccionCarta {
  return (
    typeof value === 'string' &&
    (SECCIONES_CARTA as readonly string[]).includes(value)
  );
}

// Precios del combo; fallback si el dueño no los configuró.
export const PRECIO_MENU_FALLBACK = 10;
export const PRECIO_EXTRA_FALLBACK = 15;

export function precioMenuDe(n: Pick<Negocio, 'precioMenuDia'>): number {
  return typeof n.precioMenuDia === 'number' && n.precioMenuDia > 0
    ? n.precioMenuDia
    : PRECIO_MENU_FALLBACK;
}

export function precioExtraDe(n: Pick<Negocio, 'precioExtra'>): number {
  return typeof n.precioExtra === 'number' && n.precioExtra > 0
    ? n.precioExtra
    : PRECIO_EXTRA_FALLBACK;
}

// Días: 0 = domingo (Date.getDay()).
export const DIAS_SEMANA_CORTO: string[] = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
export const DIAS_SEMANA_LARGO: string[] = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

// Resumen legible de los días de un plato ("Todos los días" / "L M X").
export function resumenDias(dias: number[] | undefined): string {
  if (!dias || dias.length === 0 || dias.length >= 7) return 'Todos los días';
  const orden: number[] = [1, 2, 3, 4, 5, 6, 0];
  return orden
    .filter((d) => dias.includes(d))
    .map((d) => DIAS_SEMANA_CORTO[d])
    .join(' ');
}

// Platos de HOY: sin campo (datos viejos u otros negocios) = siempre.
export function productosDeHoy(menu: Producto[], diaHoy: number): Producto[] {
  return menu.filter(
    (p) => !p.diasSemana || p.diasSemana.length === 0 || p.diasSemana.includes(diaHoy),
  );
}

// Agrupa por sección fija; sin sección o con etiqueta libre → "Menú".
export function agruparPorSeccion(
  productos: Producto[],
): Record<SeccionCarta, Producto[]> {
  const grupos: Record<SeccionCarta, Producto[]> = {
    Entradas: [],
    'Menú': [],
    Extras: [],
  };
  for (const p of productos) {
    const sec: SeccionCarta = esSeccionCarta(p.categoriaProducto)
      ? p.categoriaProducto
      : 'Menú';
    grupos[sec].push(p);
  }
  return grupos;
}

// Normaliza lo que llega de Firestore o del form: enteros 0-6, únicos, orden.
export function normalizarDiasSemana(value: unknown): number[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const validos: number[] = value.filter(
    (d): d is number =>
      typeof d === 'number' && Number.isInteger(d) && d >= 0 && d <= 6,
  );
  const unicos: number[] = [...new Set(validos)].sort((a, b) => a - b);
  return unicos.length > 0 ? unicos : undefined;
}
