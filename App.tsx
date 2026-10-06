import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { CartProvider } from './src/context/CartContext';
import { FavoritesProvider } from './src/context/FavoritesContext';

export default function App() {

  return (
    <SafeAreaProvider>
      <CartProvider>
        <FavoritesProvider>
          <NavigationContainer>
            <AppNavigator/>
          </NavigationContainer>
        </FavoritesProvider>
      </CartProvider>
    </SafeAreaProvider>
  );
}
