export interface Usuario {
  id: string;
  nombre: string;
  email: string;
}

export interface PerfilUsuario {
  telefono: string;
}

export interface PreferenciasUsuario {
  notificaciones: boolean;
  ubicacion: boolean;
  ofertas: boolean;
}
