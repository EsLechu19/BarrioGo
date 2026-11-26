import { Alert, StyleSheet, Text, View, Image, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useMemo, useState } from 'react'
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/AuthStackParamList';
import { FormField } from '../components/FormField';
import { PrimaryButton } from '../components/PrimaryButton';
import { authErrorEs, useAuth } from '../context/AuthContext';
import { useColors } from '../context/ThemeContext';
import type { Colors } from '../styles/colors';
import { FontAwesome } from '@expo/vector-icons';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>

export default function LoginScreen ({ navigation }: Props){
    const insets = useSafeAreaInsets();
    const { login, loginConGoogle, recuperarContrasena } = useAuth();
    const [email,setEmail] = useState('');
    const [password,setPassword] = useState('');
    const [error,setError] = useState<{email?: string; password?: string; auth?: string}>({});
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [sendingReset, setSendingReset] = useState<boolean>(false);
    const [googleSubmitting, setGoogleSubmitting] = useState<boolean>(false);
    const colors = useColors();
    const styles = useMemo(() => makeStyles(colors), [colors]);
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

    const handleForgotPassword = async () => {
        const newError: { email?: string } = {};
        if(!email.trim()) newError.email = 'El correo es necesario';
        else if(!isValidEmail(email)) newError.email = 'Ingresa un correo válido';
        setError(newError);
        if(Object.keys(newError).length > 0) return;
        setSendingReset(true);
        try {
            await recuperarContrasena(email);
            setError({});
            Alert.alert(
                'Correo enviado',
                'Si el correo existe, recibirás un enlace para crear una contraseña nueva.',
            );
        } catch (e: unknown) {
            const code = e instanceof Object && 'code' in e ? String((e as { code: unknown }).code) : '';
            setError({ auth: authErrorEs(code) });
        } finally {
            setSendingReset(false);
        }
    };

    const handleGoogleLogin = async (): Promise<void> => {
        setError({});
        setGoogleSubmitting(true);
        try {
            await loginConGoogle();
        } catch (e: unknown) {
            const code = e instanceof Object && 'code' in e ? String((e as { code: unknown }).code) : '';
            const message = e instanceof Error ? e.message : '';
            setError({ auth: code ? authErrorEs(code) : message || 'No se pudo iniciar sesión con Google.' });
        } finally {
            setGoogleSubmitting(false);
        }
    };

    const handleAppleLogin = (): void => {
        Alert.alert('Próximamente', 'El inicio de sesión con Apple estará disponible próximamente.');
    };

    const handleRegister = () => {
        console.log('Ir a registro');
        navigation.navigate('Register');
    };

    return(
        // Teclado + scroll: el contenido nunca queda tapado ni cortado (iPhone SE/16e)
        <KeyboardAvoidingView
            style={styles.screen}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView
                contentContainerStyle={styles.scroll}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/*Contenedor del login */}
                <View style={[styles.container, { paddingTop: insets.top + 35, paddingBottom: insets.bottom + 24 }]}>

                    {/* Area del logo (imagen + bienvenida)*/}
                    <View style={styles.logoArea}>
                        <View style={styles.logoFrame}>
                            <Image source={require('../../assets/img/Llamadefrente.png')} style={styles.logo} resizeMode="contain"/>
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
                            <TouchableOpacity
                                style={styles.forgotWrapper}
                                onPress={handleForgotPassword}
                                disabled={sendingReset}
                            >
                                <Text style={styles.forgotText}>
                                    {sendingReset ? 'Enviando enlace...' : '¿Olvidaste tu contraseña?'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Area de botón de ingresar + link a registro */}
                    <View style={styles.actionArea}>
                        {error.auth && <Text style={styles.authError}>{error.auth}</Text>}
                        <PrimaryButton title={submitting ? 'Ingresando...' : 'Ingresar'} onPress={handleLogin} />
                        <View style={styles.dividerRow}>
                            <View style={styles.divider} />
                            <Text style={styles.dividerText}>O continúa con</Text>
                            <View style={styles.divider} />
                        </View>
                        <View style={styles.socialRow}>
                            <TouchableOpacity
                                style={styles.socialButton}
                                onPress={() => void handleGoogleLogin()}
                                disabled={googleSubmitting}
                                accessibilityRole="button"
                                accessibilityLabel="Continuar con Google"
                            >
                                <FontAwesome name="google" size={18} color={colors.google} />
                                <Text style={styles.socialText}>{googleSubmitting ? 'Abriendo...' : 'Google'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.socialButton}
                                onPress={handleAppleLogin}
                                accessibilityRole="button"
                                accessibilityLabel="Continuar con Apple próximamente"
                            >
                                <FontAwesome name="apple" size={20} color={colors.textPrimary} />
                                <Text style={styles.socialText}>Apple</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.registerRow}>
                            <Text style={styles.registerText}>¿No tienes cuenta? </Text>
                            <TouchableOpacity onPress={handleRegister}>
                                <Text style={styles.registerLink}>Registrate</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

function makeStyles(c: Colors) {
    return StyleSheet.create({
        // Base para teclado + scroll
        screen: { flex: 1 },
        scroll: { flexGrow: 1 },

        // Contenedor principal de la pantalla
        container: { flexGrow: 1, justifyContent: 'flex-start', alignItems: 'center', gap: 24, padding: 24,backgroundColor: c.background },

        // Area del logo (imagen + bienvenida)
        logoArea: { justifyContent: 'center', alignItems: 'center', gap: 16 },
        logoFrame: { width: 154, height: 154, justifyContent: 'center', alignItems: 'center', borderRadius: 26 },
        logo: { width: 142, height: 142 },
        brandHeadline: { width: '100%', color: c.textSecondary, fontSize: 28, fontWeight: '900', textAlign: 'center' },
        brandTagline: { width: '100%', color: c.textMuted, fontSize: 15, fontWeight: 'normal', textAlign: 'center' },

        // Area del formulario
        formArea: { width: '100%', alignItems: 'center', gap: 16 },
        inputWrapper: { width: '100%', gap: 16 },
        forgotWrapper: { alignSelf: 'flex-end', marginTop: 8 },
        forgotText: { color: c.primary, fontSize: 14, fontWeight: '600' },

        // Area de botón de ingresar + link a registro
        // minHeight (no height): con el error de autentificación el contenido crece sin solaparse.
        actionArea: { width: '100%', minHeight: 89, paddingTop: 8, gap: 16 },
        authError: { color: c.google, fontSize: 14, fontWeight: '600', textAlign: 'center' },
        dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
        divider: { flex: 1, height: 1, backgroundColor: c.border },
        dividerText: { color: c.textMuted, fontSize: 12, fontWeight: '600' },
        socialRow: { flexDirection: 'row', gap: 12 },
        socialButton: { flex: 1, minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: c.border, borderRadius: 10, backgroundColor: c.surface },
        socialText: { color: c.textPrimary, fontSize: 14, fontWeight: '700' },
        registerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
        registerText: { height: 17, fontSize: 14, color: c.textMuted },
        registerLink: { height: 17, color: c.primary, fontSize: 14, fontWeight: '600' },
    })
}
