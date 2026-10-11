import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from './RootStackParamList';
import { TabParamList } from './TabParamList';

// Props de una pantalla que vive en un Tab pero también puede navegar al
// stack raíz (Detalle, Carrito, etc.). Reemplaza el CompositeScreenProps
// repetido en cada pantalla de los tabs.
export type TabScreenProps<T extends keyof TabParamList> = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;
