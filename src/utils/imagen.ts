import { Alert, Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export type ResultadoImagen =
  | { estado: 'ok'; uri: string }
  | { estado: 'cancelado' }
  | { estado: 'error'; mensaje: string };

// Elige una imagen con cámara o galería. Centraliza el permiso de cámara y el
// diálogo "Abrir ajustes" para que todas las pantallas se comporten igual.
export async function elegirImagen(
  desdeCamara: boolean,
  aspect: [number, number] = [1, 1],
): Promise<ResultadoImagen> {
  try {
    if (desdeCamara) {
      const permiso = await ImagePicker.requestCameraPermissionsAsync();
      if (!permiso.granted) {
        Alert.alert(
          'Permiso de cámara',
          'BarrioGo necesita la cámara para tomar la foto.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Abrir ajustes', onPress: () => void Linking.openSettings() },
          ],
        );
        return { estado: 'cancelado' };
      }
    }
    const opciones: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect,
      quality: 0.7,
    };
    const resultado: ImagePicker.ImagePickerResult = desdeCamara
      ? await ImagePicker.launchCameraAsync(opciones)
      : await ImagePicker.launchImageLibraryAsync(opciones);
    if (resultado.canceled) return { estado: 'cancelado' };
    const asset = resultado.assets[0];
    if (!asset) return { estado: 'cancelado' };
    return { estado: 'ok', uri: asset.uri };
  } catch {
    return {
      estado: 'error',
      mensaje: 'No se pudo elegir la foto. Intentá de nuevo.',
    };
  }
}
