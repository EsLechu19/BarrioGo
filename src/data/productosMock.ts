import { Producto } from '../types/Producto';
import raw from './productos.json';

// Fuente única: productos.json (la lee la app; el seed la sube a Firestore).
export const productosMock: Producto[] = raw as Producto[];
