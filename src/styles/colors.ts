// Paleta de la app. `lightColors` y `darkColors` comparten las MISMAS
// claves (tipo Colors) para que el tema se pueda intercambiar al instante.
export interface Colors {
  primary: string;
  background: string;
  surface: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textPlaceholder: string;
  success: string;
  error: string;
  rating: string;
  google: string;
  facebook: string;
  white: string;
  primarySoft: string;
  successSoft: string;
}

export const lightColors: Colors = {
  primary: '#f97316',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  border: '#e2e8f0',
  textPrimary: '#0f172a',
  textSecondary: '#1e293b',
  textMuted: '#64748B',
  textPlaceholder: '#94a3b8',
  success: '#10B981',
  error: '#dc2626',
  rating: 'gold',
  google: '#db4437',
  facebook: '#1877f2',
  // Tonos de apoyo reutilizados en toda la app (mismos valores de siempre).
  white: '#FFFFFF',
  primarySoft: '#FFF7ED',
  successSoft: '#ECFDF5',
};

// Oscuro: fondo slate-900, superficies slate-800, textos claros. El primario
// naranja y el verde éxito se mantienen (leen bien sobre fondo oscuro); el
// error se aclara para que también contraste.
export const darkColors: Colors = {
  primary: '#f97316',
  background: '#0F172A',
  surface: '#1E293B',
  border: '#334155',
  textPrimary: '#F8FAFC',
  textSecondary: '#E2E8F0',
  textMuted: '#94A3B8',
  textPlaceholder: '#64748B',
  success: '#10B981',
  error: '#F87171',
  rating: 'gold',
  google: '#db4437',
  facebook: '#1877f2',
  white: '#FFFFFF',
  primarySoft: '#431407',
  successSoft: '#064E3B',
};

// Compatibilidad: mientras queden imports estáticos durante la migración.
export const colors: Colors = lightColors;
