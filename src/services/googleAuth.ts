import {
  GoogleSignin,
  isSuccessResponse,
} from '@react-native-google-signin/google-signin';
import {
  GoogleAuthProvider,
  type UserCredential,
  signInWithCredential,
} from 'firebase/auth';
import { getFirebaseAuth } from './firebase';

const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
let googleConfigurado = false;

function configurarGoogle(): void {
  if (googleConfigurado) return;

  if (!webClientId) {
    throw new Error('Falta configurar el acceso con Google.');
  }

  GoogleSignin.configure({ webClientId });
  googleConfigurado = true;
}

export async function iniciarSesionConGoogle(): Promise<UserCredential | null> {
  configurarGoogle();

  await GoogleSignin.hasPlayServices({
    showPlayServicesUpdateDialog: true,
  });

  const respuesta = await GoogleSignin.signIn();

  if (!isSuccessResponse(respuesta)) {
    return null;
  }

  const idToken = respuesta.data.idToken;

  if (!idToken) {
    throw new Error('Google no devolvió una credencial válida.');
  }

  const credencial = GoogleAuthProvider.credential(idToken);

  return signInWithCredential(getFirebaseAuth(), credencial);
}

export async function cerrarSesionGoogle(): Promise<void> {
  configurarGoogle();

  if (GoogleSignin.hasPreviousSignIn()) {
    await GoogleSignin.signOut();
  }
}
