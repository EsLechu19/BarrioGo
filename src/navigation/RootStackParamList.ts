import { NavigatorScreenParams } from '@react-navigation/native';
import { TabParamList } from './TabParamList';

// Stack principal (sesión iniciada). Auth vive en AuthNavigator y la raíz
// (App.tsx) decide cuál montar según el estado de Firebase Auth.
export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  Detalle: { negocioId: string };
  Carrito: undefined;
  RegistrarNegocio: undefined;
  MiLocal: undefined;
};
