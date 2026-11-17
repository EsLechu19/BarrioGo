export interface Usuario {
  id: string;
  nombre: string;
  email: string;
}

export interface PerfilUsuario {
  telefono: string;
  // URL de Cloudinary de la foto de perfil del cliente. Opcional: los
  // perfiles viejos no la tienen.
  fotoUrl?: string;
}

// Dirección del negocio guardada en la cuenta del dueño como su
// ubicación de trabajo (se copia al registrar/editar el negocio).
export interface UbicacionTrabajo {
  direccion: string;
  lat: number;
  lng: number;
}

export interface PreferenciasUsuario {
  notificaciones: boolean;
}
