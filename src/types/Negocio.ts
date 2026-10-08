export interface Negocio {
    id: string;
    nombre: string;
    imagen: string;
    rating: number;
    opiniones: number;
    tiempoEstimado: string;
    distancia: string;
    envioGratis: boolean;
    envioMinimo?: string;
    // Coordenadas del local (Lima). El GPS del cliente se compara
    // contra esto para ordenar por cercanía real.
    lat: number;
    lng: number;
    descripcion?: string;
    direccion?: string;
    duenioId?: string;
    // Portada 16:9 del negocio (S3 apf6-negocio-propio). `imagen` sigue
    // siendo el icono/cuadrado que se muestra en las cards.
    portada?: string;
}