// Categoría real del negocio (Fase 1). `otro` para negocios que no encajan
// con las categorías fijas del catálogo.
export type CategoriaNegocio =
    | 'polleria'
    | 'chifa'
    | 'comida_criolla'
    | 'broaster'
    | 'anticuchos'
    | 'cevicheria'
    | 'caldos'
    | 'pizza'
    | 'pasteleria'
    | 'sangucheria'
    | 'jugueria'
    | 'cafeteria'
    | 'otro';

// Franja de un día del horario. `dia` usa Date.getDay() (0 = domingo).
// Si `cierre` <= `apertura` la franja cruza la medianoche (ej. 22:00–02:00).
export interface HorarioDia {
    dia: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    apertura: string; // "HH:mm"
    cierre: string;   // "HH:mm"
}

export interface Negocio {
    id: string;
    nombre: string;
    imagen: string;
    rating: number;
    opiniones: number;
    tiempoEstimado: string;
    distancia: string;
    envioGratis: boolean;
    // Costo de envío en soles (Fase checkout). Ausente/0 = sin costo.
    // Se ignora si envioGratis es true.
    costoEnvio?: number;
    // Coordenadas del local (Lima). El GPS del cliente se compara
    // contra esto para ordenar por cercanía real.
    lat: number;
    lng: number;
    descripcion?: string;
    direccion?: string;
    duenioId?: string;
    // Categoría del negocio (Fase 1). Ausente = sin clasificar: no coincide
    // con los filtros por categoría de RestaurantsScreen.
    categoria?: CategoriaNegocio;
    // Varias categorías a la vez (ej. pollería + chifa + caldos).
    // El filtro usa `categorias` si tiene; si no, cae a `categoria`.
    categorias?: CategoriaNegocio[];
    // Portada 16:9. `imagen` sigue siendo el icono de las cards.
    portada?: string;
    // Abrir/cerrar manual: undefined = horario programado, true/false = forzado.
    // El estado efectivo no se guarda: se deriva con estaAbierto().
    abiertoManual?: boolean;
    // Horario semanal programado. Ausente o vacío = sin horario (siempre
    // abierto salvo override manual).
    horario?: HorarioDia[];
    // Carta diaria (restaurantes con comida_criolla): precios del menú del
    // día (entrada+comida) y de cada extra. Ausente = 10 / 15.
    precioMenuDia?: number;
    precioExtra?: number;
}