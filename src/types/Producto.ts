export interface Producto {
  id: string;
  negocioId: string;
  nombre: string;
  precio: number;
  imagen?: string;
  descripcion: string;
}