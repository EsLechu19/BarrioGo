import {Producto} from './Producto';

/* Union Types - Representa los posibles estados de un pedido */
/* este valor puede ser de uno de estos tipos, y solo esos */
export type EstadoPedido = 
|'PENDIENTE' 
|'CONFIRMADO' 
|'EN_CAMINO' 
|'ENTRREGADO'
|'CANCELADO';

export interface ItemPedido {
    producto: Producto;
    cantidad: number;
}

export interface Pedido {
    id: string;
    items: ItemPedido[];
    estado: EstadoPedido;
    total: number;
    negocioId: string;
}