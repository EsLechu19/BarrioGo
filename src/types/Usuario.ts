export type RolUsuario= 
|"CLIENTE" 
| "NEGOCIO" ;

export interface Usuario {
    id: string;
    nombre: string;
    email: string;
    rol: RolUsuario;
}