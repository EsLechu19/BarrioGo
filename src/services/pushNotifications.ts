
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';

import { doc, setDoc, arrayUnion } from 'firebase/firestore';

import { getFirebaseAuth, getFirestoreDb } from './firebase';
import { asegurarPermisoNotificaciones } from './notificaciones';

// Indica si el usuario ya autorizó las notificaciones (sin volver a pedirlas).
export async function permisoNotificacionesOtorgado(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const permisos = await Notifications.getPermissionsAsync();
    return permisos.granted;
  } catch {
    return false;
  }
}

// Obtener el Expo Push Token del dispositivo.
export async function obtenerExpoPushToken(
  solicitarPermiso = true,
): Promise<string | null> {
  try {
    if (Platform.OS === 'web') return null;

    // Solicitar permisos mediante el servicio existente, salvo que el llamador
    // ya los haya pedido en un momento con contexto (switch o primer pedido).
    const autorizado = solicitarPermiso
      ? await asegurarPermisoNotificaciones()
      : await permisoNotificacionesOtorgado();

    if (!autorizado) {
      console.warn('El usuario no autorizó las notificaciones.');
      return null;
    }

    // Obtener el identificador del proyecto EAS.
    const projectId =
      Constants.easConfig?.projectId ??
      Constants.expoConfig?.extra?.eas?.projectId;

    if (!projectId) {
      throw new Error('No se encontró el projectId de EAS.');
    }

    // Obtener el token del dispositivo.
    const token = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    return token.data;
  } catch (error) {
    console.error('Error al obtener Expo Push Token:', error);
    return null;
  }
}

// Guardar el Expo Push Token en Firestore.
export async function guardarExpoPushToken(
  usuarioId: string,
  token: string
): Promise<void> {
  if (!usuarioId.trim() || !token.trim()) {
    throw new Error('Usuario o token inválido.');
  }
  // Verificar que el usuario esté autenticado.
  const usuarioActual = getFirebaseAuth().currentUser;

  if (!usuarioActual || usuarioActual.uid !== usuarioId) {
    throw new Error('El usuario no está autenticado o el UID no coincide.');
  }

  // Reutilizar la conexión Firestore existente.
  const db = getFirestoreDb();

  try {
    await setDoc(
      doc(db, 'users', usuarioId),
      {
        expoPushTokens: arrayUnion(token),
      },
      { merge: true }
    );

    console.log('Expo Push Token guardado en Firestore.');
  } catch (error) {
    console.error('Error al guardar Expo Push Token:', error);
    throw error;
  }
}

// Registra el token solo si el permiso ya está concedido. Se usa al iniciar
// sesión para no mostrar el diálogo de permisos sin contexto.
export async function registrarPushToken(usuarioId: string): Promise<void> {
  if (!usuarioId.trim()) return;
  try {
    const token = await obtenerExpoPushToken(false);
    if (!token) return;
    await guardarExpoPushToken(usuarioId, token);
  } catch (error) {
    console.warn('No se pudo registrar el push token:', error);
  }
}
