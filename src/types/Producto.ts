export interface Producto {
    id: string;
    nombre: string;
    precio: number;
    negocioId: string;
    imagenUrl?: string; /* lleva ? para indicar que es opcional(puede que aun no tenga foto subida)*/
}