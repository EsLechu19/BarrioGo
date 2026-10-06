import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useState } from 'react'
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/AuthStackParamList';
import { FormField } from '../components/FormField';
import { PrimaryButton } from '../components/PrimaryButton';
import { authErrorEs, useAuth } from '../context/AuthContext';
import { colors } from '../styles/colors';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>

export default function LoginScreen ({ navigation }: Props){
    const insets = useSafeAreaInsets();
    const { login } = useAuth();
    const [email,setEmail] = useState('');
    const [password,setPassword] = useState('');
    const [error,setError] = useState<{email?: string; password?: string; auth?: string}>({});
    const [submitting, setSubmitting] = useState<boolean>(false);
    const isValidEmail = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
    const handleLogin = async () => {
        const newError: {email?:string;password?:string} = {};
        if(!email.trim()) newError.email = 'El correo es necesario';
        else if(!isValidEmail(email)) newError.email = 'Ingresa un correo válido';
        if(!password) newError.password = 'La contraseña es necesaria';
        else if(password.length < 6) newError.password = 'Mínimo 6 caracteres';
        setError(newError);
        if(Object.keys(newError).length > 0) return;
        setSubmitting(true);
        try {
            await login(email, password);
            // La raíz (App.tsx) monta AppNavigator sola al detectar sesión.
        } catch (e: unknown) {
            const code = e instanceof Object && 'code' in e ? String((e as { code: unknown }).code) : '';
            setError({ auth: authErrorEs(code) });
        } finally {
            setSubmitting(false);
        }
    }

    const handleForgotPassword = () => {
        console.log('Olvidó contraseña');
        // Aquí navegarías a la pantalla de recuperar contraseña
    };

    const handleRegister = () => {
        console.log('Ir a registro');
        navigation.navigate('Register');
    };

    const handleFacebookLogin = () => {
        console.log('Login con Facebook');
    };

    const handleGoogleLogin = () => {
        console.log('Login con Google');
    };

    return(
        //Contenedor del login
        <View  style={[styles.container, { paddingTop: insets.top + 35 }]}>
            
            {/* Area del logo (imagen + bienvenida)*/}
            <View style={styles.logoArea}>
                <View style={styles.logoFrame}>
                    <Image source={require('../../assets/img/logo1.png')} style={styles.logo} resizeMode="contain"/>
                </View>
                <Text style={styles.brandHeadline}>¡Bienvenido de vuelta!</Text>
                <Text style={styles.brandTagline}>Inicia sesión para continuar</Text>
            </View>

            {/* Area del formulario */}
            <View style={styles.formArea}>
                <FormField
                    label="Correo electrónico"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="tucorreo@ejemplo.com"
                    error={error.email}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />
                <View style={styles.inputWrapper}>
                    <FormField
                        label="Contraseña"
                        value={password}
                        onChangeText={setPassword}
                        placeholder="●●●●●●●●●●●●"
                        error={error.password}
                        secureTextEntry
                    />
                    <TouchableOpacity style={styles.forgotWrapper} onPress={handleForgotPassword}>
                        <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Area de botón de ingresar + link a registro */}
            <View style={styles.actionArea}>
                {error.auth && <Text style={styles.authError}>{error.auth}</Text>}
                <PrimaryButton title={submitting ? 'Ingresando...' : 'Ingresar'} onPress={handleLogin} />
                <View style={styles.registerRow}>
                    <Text style={styles.registerText}>¿No tienes cuenta? </Text>
                    <TouchableOpacity onPress={handleRegister}>
                        <Text style={styles.registerLink}>Registrate</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Area de separador "O continúa con" */}
            <View style={styles.dividerRow}>
                <View style={styles.dividerLine}/>
                <Text style={styles.dividerText}>O continúa con</Text>
                <View style={styles.dividerLine}/>
            </View>

            {/* Area de botones de login social (Facebook / Google) */}
            <View style={styles.socialRow}>
                <TouchableOpacity style={styles.socialButton} onPress={handleGoogleLogin}>
                    <Ionicons name='logo-google' size={20} color={colors.google}/>
                    <Text style={styles.socialText}>Google</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialButton} onPress={handleFacebookLogin}>
                    <Ionicons name='logo-facebook' size={20} color={colors.facebook}/>
                    <Text style={styles.socialText}>Facebook</Text>
                </TouchableOpacity>
            </View>
        </View >
    );
}

const styles = StyleSheet.create({
    // Contenedor principal de la pantalla
    container: { flex: 1, justifyContent: 'flex-start', alignItems: 'center', gap: 24, padding: 24,backgroundColor: colors.background },

    // Area del logo (imagen + bienvenida)
    logoArea: { justifyContent: 'center', alignItems: 'center', gap: 16 },
    logoFrame: { width: 154, height: 154, justifyContent: 'center', alignItems: 'center', borderRadius: 26 },
    logo: { width: 142, height: 142 },
    brandHeadline: { width: '100%', color: colors.textSecondary, fontSize: 28, fontWeight: '900', textAlign: 'center' },
    brandTagline: { width: '100%', color: colors.textMuted, fontSize: 15, fontWeight: 'normal', textAlign: 'center' },

    // Area del formulario
    formArea: { width: '100%', alignItems: 'center', gap: 16 },
    inputWrapper: { width: '100%', gap: 16 },
    forgotWrapper: { alignSelf: 'flex-end', marginTop: 8 },
    forgotText: { color: colors.primary, fontSize: 14, fontWeight: '600' },

    // Area de botón de ingresar + link a registro
    actionArea: { width: '100%', height: 89, paddingTop: 8, gap: 16 },
    authError: { color: colors.google, fontSize: 14, fontWeight: '600', textAlign: 'center' },
    registerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    registerText: { height: 17, fontSize: 14 },
    registerLink: { height: 17, color: colors.primary, fontSize: 14, fontWeight: '600' },

    // Area de separador "O continúa con"
    dividerRow: { flexDirection: 'row', width: '100%', alignItems: 'center', gap: 12 },
    dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
    dividerText: { color: colors.textPlaceholder, fontSize: 13, fontWeight: '600' },

    // Area de botones de login social (Facebook / Google)
    socialRow: { flexDirection: 'row', width: '100%', gap: 12 },
    socialButton: { flex: 1, flexDirection: 'row', height: 48, justifyContent: 'center', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 12 ,backgroundColor: colors.surface },
    socialText: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' }
})