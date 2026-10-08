import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './RootStackParamList';
import { TabNavigator } from './TabNavigator';
import DetalleScreen from '../screens/DetalleScreen';
import CarritoScreen from '../screens/CarritoScreen';
import RegistrarNegocioScreen from '../screens/RegistrarNegocioScreen';
import MiLocalScreen from '../screens/MiLocalScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Tabs" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen name="Detalle" component={DetalleScreen} />
      <Stack.Screen name="Carrito" component={CarritoScreen} />
      <Stack.Screen name="RegistrarNegocio" component={RegistrarNegocioScreen} />
      <Stack.Screen name="MiLocal" component={MiLocalScreen} />
    </Stack.Navigator>
  );
}

// Navegación principal: Auth -> Tabs (cliente) -> Detalle/Carrito.
