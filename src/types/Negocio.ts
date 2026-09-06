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
}