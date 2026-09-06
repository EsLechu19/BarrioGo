import { StyleSheet, Text, View, ImageBackground, Image } from 'react-native'
import { RootStackParamList } from '../navigation/RootStackParamList'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { PrimaryButton } from '../components/PrimaryButton';
import { colors } from '../styles/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>

export default function SplashScreen({ navigation }: Props) {
    return (
        <ImageBackground source={require('../../assets/img/fondo.jpg')} style={styles.background}>
            <View style={styles.container}>
                <View style={styles.logoArea}>
                    <View style={styles.logoFrame}>
                        <Image source={require('../../assets/img/logo2.png')} style={styles.logo} resizeMode="contain" />
                    </View>
                    <Text style={styles.brand}>Barrio<Text style={styles.go}>Go</Text></Text>
                    <Text style={styles.tagline}>Tu barrio, a un pedido de distancia</Text>
                </View>

                <View style={styles.footer}>
                    <PrimaryButton title="Comenzar" onPress={() => navigation.replace('Login')} />
                    <Text style={styles.version}>Versión 1.0.0</Text>
                </View>
            </View>
        </ImageBackground>
    )
}


const styles = StyleSheet.create({
    // Fondo de la pantalla
    background: { flex: 1 },

    // Contenedor principal de la pantalla
    container: { flex: 1, justifyContent: 'space-between', padding: 26, paddingTop: 60 },

    // Area del logo (imagen + marca)
    logoArea: { justifyContent: 'center', alignItems: 'center', gap: 16, padding: 40 },
    logoFrame: { width: 154, height: 154, justifyContent: 'center', alignItems: 'center', borderRadius: 26, backgroundColor: 'rgba(255, 255, 255, 0.2)' },
    logo: { width: 142, height: 142 },
    brand: { color: colors.surface, fontSize: 40, fontWeight: '800', textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 6 },
    go: { color: colors.primary },
    tagline: { width: 200, color: colors.textSecondary, fontSize: 16, fontWeight: '700', textAlign: 'center' },

    // Area del pie (boton + version)
    footer: { gap: 12 },
    version: { paddingBottom: 30, color: colors.surface, fontSize: 12, fontWeight: '700', textAlign: 'center' },
})