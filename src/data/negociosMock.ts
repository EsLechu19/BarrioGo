import { Negocio } from '../types/Negocio';
import raw from './negocios.json';

// Fuente única: negocios.json (la leen la app, el mock-server y el seed).
export const negociosMock: Negocio[] = raw as Negocio[];
