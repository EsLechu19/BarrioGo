import { NavigatorScreenParams } from '@react-navigation/native';
import { TabParamList } from './TabParamList';

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  Detalle: { negocioId: string };
  Carrito: undefined;
};
