import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from './RootStackParamList';
import { TabParamList } from './TabParamList';

// Props de una pantalla Tab que también navega al stack raíz
// (Detalle, Carrito…). Evita repetir CompositeScreenProps en cada pantalla.
export type TabScreenProps<T extends keyof TabParamList> = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;
