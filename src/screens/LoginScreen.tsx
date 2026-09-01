import {View, Text, Button} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigation/RootStackParamList'; type Props = NativeStackScreenProps<RootStackParamList, 'Login'>
export function LoginScreen({navigation}: Props) {
    return (
        <View>
            <Text>Pantala de Login</Text>
            <Button title="Ir a Home" onPress={() => navigation.navigate('Home')} />
        </View>
    );
}