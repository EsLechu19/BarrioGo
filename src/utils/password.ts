export const PASSWORD_POLICY_HINT =
  'Mínimo 8 caracteres, con mayúscula, minúscula, número y carácter especial.';

export function validarContrasenaSegura(password: string): string | undefined {
  if (password.length < 8) {
    return 'La contraseña debe tener al menos 8 caracteres.';
  }

  if (!/[A-Z]/.test(password)) {
    return 'Incluye al menos una mayúscula.';
  }

  if (!/[a-z]/.test(password)) {
    return 'Incluye al menos una minúscula.';
  }

  if (!/\d/.test(password)) {
    return 'Incluye al menos un número.';
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return 'Incluye al menos un carácter especial.';
  }

  return undefined;
}
