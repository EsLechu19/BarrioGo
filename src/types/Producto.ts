export interface Producto {
  id: string;
  negocioId: string;
  nombre: string;
  precio: number;
  imagen?: string;
  descripcion: string;
  // Categoría del plato dentro del menú, etiqueta libre del negocio
  // (ej. "Pollo"). Ausente = solo aparece en el filtro "Todos".
  categoriaProducto?: string;
  // Pausa del dueño (Fase 5): `false` = oculto del catálogo del cliente
  // (Detalle) pero sigue en el panel para reactivarlo. Ausente = disponible.
  disponible?: boolean;
  // Carta diaria (restaurantes): días de la semana en que el plato aparece
  // (0 = domingo, Date.getDay()). Ausente o vacío = todos los días.
  diasSemana?: number[];
}