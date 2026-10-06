import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { StyleSheet, View, Image, Text, TouchableOpacity } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { RootStackParamList } from '../navigation/RootStackParamList';
import { FormField } from '../components/FormField';
import { PrimaryButton } from '../components/PrimaryButton';
import { storage } from '../services/storage';
import { colors } from '../styles/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>

export default function RegisterScreen({ navigation }: Props) {
    const insets = useSafeAreaInsets();
    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<{ nombre?: string; email?: string; password?: string }>({});
    const isValidEmail = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    const handleRegister = () => {
        const newError: { nombre?: string; email?: string; password?: string } = {};
        if (!nombre.trim()) newError.nombre = 'El nombre es necesario';
        if (!email.trim()) newError.email = 'El correo es necesario';
        else if (!isValidEmail(email)) newError.email = 'Ingresa un correo válido';
        if (!password.trim()) newError.password = 'La contraseña es necesaria';
        setError(newError);
        if (Object.keys(newError).length === 0) {
            storage.saveSession({ nombre, email });
            navigation.navigate('Tabs');
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top + 35 }]}>
            {/* Area del logo*/}
            <View style={styles.logoArea}>
                <View style={styles.logoFrame}>
                    <Image source={require('../../assets/img/logo4.png')} style={styles.logo} resizeMode="contain" />
                </View>
                <Text style={styles.brandHeadline}>Crea tu cuenta</Text>
                <Text style={styles.brandTagline}>Únete a BarrioGo y pide de tus tiendas favoritas</Text>
            </View>
            {/* Area del formulario */}
            <View style={styles.formArea}>
                <FormField
                    label="Nombre completo"
                    value={nombre}
                    onChangeText={setNombre}
                    placeholder="Tu nombre"
                    error={error.nombre}
                    autoCapitalize="words"
                    keyboardType="default"
                />
                <FormField
                    label="Correo electrónico"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="ejemplo@gmail.com"
                    error={error.email}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />
                <FormField
                    label="Contraseña"
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Minimo 6 caracteres"
                    error={error.password}
                    autoCapitalize="none"
                    keyboardType="default"
                    secureTextEntry
                />
                <FormField
                    label="Confirmar contraseña"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Repite tu contraseña"
                    autoCapitalize="none"
                    keyboardType="default"
                    secureTextEntry
                />
            </View>
            {/* Area de boton de registrarse + link de inicia sesion */}
            <View style={styles.actionArea}>
                <PrimaryButton title="Registrarme" onPress={handleRegister} />
                <View style={styles.loginRow}>
                    <Text style={styles.loginText}>¿Ya tienes cuenta? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.loginLink}>Inicia sesión</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    // Contenedor principal de la pantalla
    container: { flex: 1, justifyContent: 'flex-start', alignItems: 'center', gap: 24, padding: 24, backgroundColor: colors.background },

    // Area del logo
    logoArea: { width: '100%', justifyContent: 'center', alignItems: 'center', gap: 16 },
    logoFrame: { width: 154, height: 154, justifyContent: 'center', alignItems: 'center', borderRadius: 26 },
    logo: { width: 142, height: 142 },
    brandHeadline: { width: '100%', alignSelf: 'flex-start', color: colors.textSecondary, fontSize: 28, fontWeight: '900', textAlign: 'left' },
    brandTagline: { width: '100%', alignSelf: 'flex-start', color: colors.textMuted, fontSize: 15, fontWeight: 'normal', textAlign: 'left' },

    // Area del formulario
    formArea: { width: '100%', alignItems: 'center', gap: 8 },

    // Area de boton de registrarse + link de inicia sesion
    actionArea: { width: '100%', height: 89, paddingTop: 8, gap: 16 },
    loginRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    loginText: { height: 17, fontSize: 14 },
    loginLink: { height: 17, color: colors.primary, fontSize: 14, fontWeight: '600' }
});