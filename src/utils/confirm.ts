import { Alert } from 'react-native';

// Diálogo de confirmación. true si acepta, false si cancela. Uso:
//   const ok: boolean = await confirm({ title: 'Vaciar carrito', message: '...' });
//   if (ok) clear();
export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
}

export function confirm(options: ConfirmOptions): Promise<boolean> {
  const {
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    destructive = false,
  } = options;
  return new Promise<boolean>((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: cancelText, style: 'cancel', onPress: () => resolve(false) },
        {
          text: confirmText,
          style: destructive ? 'destructive' : 'default',
          onPress: () => resolve(true),
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}
