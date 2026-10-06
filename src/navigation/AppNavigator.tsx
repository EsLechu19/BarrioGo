import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './RootStackParamList';
import { TabNavigator } from './TabNavigator';
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DetalleScreen from '../screens/DetalleScreen';
import CarritoScreen from '../screens/CarritoScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen name="Detalle" component={DetalleScreen} />
      <Stack.Screen name="Carrito" component={CarritoScreen} />
    </Stack.Navigator>
  );
}

// Navegación principal: Auth -> Tabs (cliente) -> Detalle/Carrito.
