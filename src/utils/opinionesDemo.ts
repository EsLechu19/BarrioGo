import type { Opinion, Estrellas } from '../types/Opinion';

// Opiniones de EJEMPLO, determinísticas por negocio (5-10, mismas siempre).
// Siempre quedan al final, debajo de las reales de Firestore.
interface SemillaOpinion {
  nombre: string;
  estrellas: Estrellas;
  texto: string;
}

// 31 semillas (número primo): con cualquier paso no se repiten índices
// dentro de las 5-10 opiniones que toma cada negocio.
const POOL: SemillaOpinion[] = [
  // 5★
  { nombre: 'María Torres', estrellas: 5, texto: 'Todo llegó rápido y bien presentado. El sabor de siempre.' },
  { nombre: 'Lucía Fernández', estrellas: 5, texto: 'Pedimos para toda la familia y todo llegó caliente. Volveremos a pedir.' },
  { nombre: 'Ana Paredes', estrellas: 5, texto: 'Mi pedido favorito del barrio. Recomendado sin dudarlo.' },
  { nombre: 'Rosa Quispe', estrellas: 5, texto: 'Llegó antes de lo estimado y muy bien empacado.' },
  { nombre: 'Elena Vargas', estrellas: 5, texto: 'Excelente sabor y porciones. Atención amable al recoger.' },
  { nombre: 'Camila Rojas', estrellas: 5, texto: 'La mejor del barrio: puntuales, buen trato y todo riquísimo.' },
  { nombre: 'Sofía Mendoza', estrellas: 5, texto: 'Pedí por la app y en 20 minutos estaba todo en la puerta. Cinco estrellas.' },
  { nombre: 'Patricio Linares', estrellas: 5, texto: 'Atienden rápido y nunca se equivocan con el pedido. Así da gusto.' },
  { nombre: 'Gabriela Salas', estrellas: 5, texto: 'Las porciones están generosas y todo fresco. Mi lugar de siempre.' },
  { nombre: 'Héctor Ibáñez', estrellas: 5, texto: 'Se nota la receta de casa. Nadie en la zona le llega.' },
  // 4★
  { nombre: 'Carlos Quispe', estrellas: 4, texto: 'Buen sabor y porción generosa. Tardó un poco más de lo estimado.' },
  { nombre: 'Jorge Medina', estrellas: 4, texto: 'Buena atención y precio justo. Repetiremos esta semana.' },
  { nombre: 'Miguel Salas', estrellas: 4, texto: 'Todo correcto. La relación precio-calidad es de las mejores de la zona.' },
  { nombre: 'Ricardo Cruz', estrellas: 4, texto: 'Rápido y sin problemas. Se nota el trato de barrio.' },
  { nombre: 'Valeria Ñahui', estrellas: 4, texto: 'Rico y bien servido. El envío se demoró unos minutos de más.' },
  { nombre: 'Diego Ramos', estrellas: 4, texto: 'Buena comida, aunque el empaque vino algo abierto. El sabor lo salva.' },
  { nombre: 'Fernanda Ortiz', estrellas: 4, texto: 'Me gustó la atención y el sabor. Volvería, quizá pidiendo un poco antes.' },
  { nombre: 'Andrés Villar', estrellas: 4, texto: 'Cumple con lo que promete: caliente, rico y a buen precio.' },
  { nombre: 'Rocío Prado', estrellas: 4, texto: 'Muy buena opción para pedir en la noche. Solo le faltó un poco más de salsa.' },
  // 3★
  { nombre: 'Luis Herrera', estrellas: 3, texto: 'Rico, aunque la porción vino un poco pequeña esta vez.' },
  { nombre: 'Kenji Nakamura', estrellas: 3, texto: 'Sabor bien, pero el pedido llegó tibio. Esperaba más calor.' },
  { nombre: 'Paola Chumpitaz', estrellas: 3, texto: 'Está okay para el precio. La espera se hizo un poco larga.' },
  { nombre: 'Óscar Ponce', estrellas: 3, texto: 'Regular: cumple, aunque esta vez faltó un condimento que siempre traen.' },
  { nombre: 'Tatiana Vílchez', estrellas: 3, texto: 'Comida decente y barata. El empaque podría mejorar.' },
  { nombre: 'Renzo Farfán', estrellas: 3, texto: 'Bien en general; el pedido llegó tibio pero sabroso.' },
  { nombre: 'Xiomara León', estrellas: 3, texto: 'Normal: rico, pero me hubiera gustado más cantidad por el precio.' },
  // 2★
  { nombre: 'Mónica Aguilar', estrellas: 2, texto: 'El pedido llegó frío y tarde. El sabor no estuvo como la vez anterior.' },
  { nombre: 'Iván Bustamante', estrellas: 2, texto: 'Faltó un producto que había pagado. Tuvimos que llamar para reclamar.' },
  { nombre: 'Silvana Ríos', estrellas: 2, texto: 'Demoraron casi una hora y la comida venía derramada. Muy improducente.' },
  { nombre: 'Peter Cortés', estrellas: 2, texto: 'La porción estaba fría y recalentada. Espero que la próxima mejore.' },
  { nombre: 'Julissa Merino', estrellas: 2, texto: 'Me cobraron de más y tuvimos que discutirlo. La comida, regular.' },
];

const MS_POR_DIA = 86400000;

function hash(texto: string): number {
  let h = 0;
  for (let i = 0; i < texto.length; i++) {
    h = (h * 31 + texto.charCodeAt(i)) >>> 0;
  }
  return h;
}

// 5 a 10 opiniones por negocio, siempre las mismas para el mismo id.
export function opinionesDemo(negocioId: string): Opinion[] {
  const base: number = hash(negocioId.trim() || 'preview');
  const inicio: number = base % POOL.length;
  const paso: number = 1 + (base % (POOL.length - 1));
  const cantidad: number = 5 + (base % 6);
  const hoy: number = Date.now();
  const opiniones: Opinion[] = [];
  for (let i = 0; i < cantidad; i++) {
    const semilla: SemillaOpinion = POOL[(inicio + i * paso) % POOL.length];
    opiniones.push({
      id: `demo-${negocioId}-${i}`,
      negocioId,
      usuarioId: `demo-user-${(base + i) % 97}`,
      nombre: semilla.nombre,
      estrellas: semilla.estrellas,
      texto: semilla.texto,
      // Entre 3 y 89 días atrás, repartidas para que no se vean del mismo día.
      fecha: new Date(hoy - (3 + ((base + i * 11) % 87)) * MS_POR_DIA).toISOString(),
    });
  }
  return opiniones;
}

// Promedio y conteo que muestran Inicio, Restaurantes y Detalle: es la única
// fuente del rating (los campos rating/opiniones del catálogo no se usan).
export interface ResumenOpiniones {
  promedio: number;
  cantidad: number;
}

export function resumenOpiniones(opiniones: Opinion[]): ResumenOpiniones {
  if (opiniones.length === 0) return { promedio: 0, cantidad: 0 };
  const suma: number = opiniones.reduce((acc, o) => acc + o.estrellas, 0);
  return { promedio: suma / opiniones.length, cantidad: opiniones.length };
}
