import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { StyleSheet, View, Image, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AuthStackParamList } from '../navigation/AuthStackParamList';
import { FormField } from '../components/FormField';
import { PrimaryButton } from '../components/PrimaryButton';
import { authErrorEs, useAuth } from '../context/AuthContext';
import { useColors } from '../context/ThemeContext';
import type { Colors } from '../styles/colors';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>

export default function RegisterScreen({ navigation }: Props) {
    const insets = useSafeAreaInsets();
    const { register } = useAuth();
    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<{ nombre?: string; email?: string; password?: string; confirmPassword?: string; auth?: string }>({});
    const [submitting, setSubmitting] = useState<boolean>(false);
    const colors = useColors();
    const styles = useMemo(() => makeStyles(colors), [colors]);
    const isValidEmail = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
    const handleRegister = async () => {
        const newError: { nombre?: string; email?: string; password?: string; confirmPassword?: string } = {};
        if (!nombre.trim()) newError.nombre = 'El nombre es necesario';
        else if (nombre.trim().length < 3) newError.nombre = 'El nombre debe tener al menos 3 letras';
        if (!email.trim()) newError.email = 'El correo es necesario';
        else if (!isValidEmail(email)) newError.email = 'Ingresa un correo válido';
        if (!password) newError.password = 'La contraseña es necesaria';
        else if (password.length < 6) newError.password = 'Mínimo 6 caracteres';
        if (!confirmPassword) newError.confirmPassword = 'Repite tu contraseña';
        else if (confirmPassword !== password) newError.confirmPassword = 'No coincide con la contraseña';
        setError(newError);
        if (Object.keys(newError).length > 0) return;
        setSubmitting(true);
        try {
            await register(nombre, email, password);
            // La raíz (App.tsx) monta AppNavigator sola al detectar sesión.
        } catch (e: unknown) {
            const code = e instanceof Object && 'code' in e ? String((e as { code: unknown }).code) : '';
            setError({ auth: authErrorEs(code) });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        // Teclado + scroll: el contenido nunca queda tapado ni cortado
        <KeyboardAvoidingView
            style={styles.screen}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView
                contentContainerStyle={styles.scroll}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <View style={[styles.container, { paddingTop: insets.top + 35, paddingBottom: insets.bottom + 24 }]}>
                    {/* Area del logo*/}
                    <View style={styles.logoArea}>
                        <View style={styles.logoFrame}>
                            <Image source={require('../../assets/img/llamaregister.png')} style={styles.logo} resizeMode="contain" />
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
                            error={error.confirmPassword}
                            autoCapitalize="none"
                            keyboardType="default"
                            secureTextEntry
                        />
                    </View>
                    {/* Area de boton de registrarse + link de inicia sesion */}
                    <View style={styles.actionArea}>
                        {error.auth && <Text style={styles.authError}>{error.auth}</Text>}
                        <PrimaryButton title={submitting ? 'Creando cuenta...' : 'Registrarme'} onPress={handleRegister} />
                        <View style={styles.loginRow}>
                            <Text style={styles.loginText}>¿Ya tienes cuenta? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                <Text style={styles.loginLink}>Inicia sesión</Text>
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
        container: { flexGrow: 1, justifyContent: 'flex-start', alignItems: 'center', gap: 24, padding: 24, backgroundColor: c.background },

        // Area del logo
        logoArea: { width: '100%', justifyContent: 'center', alignItems: 'center', gap: 16 },
        logoFrame: { width: 154, height: 154, justifyContent: 'center', alignItems: 'center', borderRadius: 26 },
        logo: { width: 142, height: 142 },
        brandHeadline: { width: '100%', alignSelf: 'flex-start', color: c.textSecondary, fontSize: 28, fontWeight: '900', textAlign: 'left' },
        brandTagline: { width: '100%', alignSelf: 'flex-start', color: c.textMuted, fontSize: 15, fontWeight: 'normal', textAlign: 'left' },

        // Area del formulario
        formArea: { width: '100%', alignItems: 'center', gap: 8 },

        // Area de boton de registrarse + link de inicia sesion
        // minHeight (no height): con el error de autentificación el contenido crece sin solaparse.
        actionArea: { width: '100%', minHeight: 89, paddingTop: 8, gap: 16 },
        authError: { color: c.google, fontSize: 14, fontWeight: '600', textAlign: 'center' },
        loginRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
        loginText: { height: 17, fontSize: 14, color: c.textMuted },
        loginLink: { height: 17, color: c.primary, fontSize: 14, fontWeight: '600' }
    });
}