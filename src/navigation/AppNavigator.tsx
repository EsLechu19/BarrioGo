import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './RootStackParamList';
import { TabNavigator } from './TabNavigator';
import DetalleScreen from '../screens/DetalleScreen';
import RestaurantsScreen from '../screens/RestaurantsScreen';
import CarritoScreen from '../screens/CarritoScreen';
import PedidoDetalleScreen from '../screens/PedidoDetalleScreen';
import NotificacionesScreen from '../screens/NotificacionesScreen';
import RegistrarNegocioScreen from '../screens/RegistrarNegocioScreen';
import MiLocalScreen from '../screens/MiLocalScreen';
import MisDatosScreen from '../screens/MisDatosScreen';
import DireccionesScreen from '../screens/DireccionesScreen';
import MetodosPagoScreen from '../screens/MetodosPagoScreen';
import AyudaScreen from '../screens/AyudaScreen';
import ConfiguracionScreen from '../screens/ConfiguracionScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Tabs" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen name="Detalle" component={DetalleScreen} />
      <Stack.Screen name="Restaurants" component={RestaurantsScreen} />
      <Stack.Screen name="Carrito" component={CarritoScreen} />
      <Stack.Screen name="PedidoDetalle" component={PedidoDetalleScreen} />
      <Stack.Screen name="Notificaciones" component={NotificacionesScreen} />
      <Stack.Screen name="RegistrarNegocio" component={RegistrarNegocioScreen} />
      <Stack.Screen name="MiLocal" component={MiLocalScreen} />
      <Stack.Screen name="MisDatos" component={MisDatosScreen} />
      <Stack.Screen name="Direcciones" component={DireccionesScreen} />
      <Stack.Screen name="MetodosPago" component={MetodosPagoScreen} />
      <Stack.Screen name="Ayuda" component={AyudaScreen} />
      <Stack.Screen name="Configuracion" component={ConfiguracionScreen} />
    </Stack.Navigator>
  );
}

// Navegación principal: Auth -> Tabs (cliente) -> Detalle/Carrito.
