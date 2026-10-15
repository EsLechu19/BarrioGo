import { useMemo, useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, KeyboardTypeOptions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../context/ThemeContext';
import type { Colors } from '../styles/colors';

type Props = {
    label?: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    error?: string;
    secureTextEntry?: boolean;
    keyboardType?: KeyboardTypeOptions;
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
};

export function FormField({
    label,
    value,
    onChangeText,
    placeholder,
    error,
    secureTextEntry,
    keyboardType,
    autoCapitalize,
}: Props) {
    const colors = useColors();
    const styles = useMemo(() => makeStyles(colors), [colors]);
    const [hidden, setHidden] = useState<boolean>(secureTextEntry ?? false);
    const showEye = secureTextEntry === true;
    return (
        // contenedor del campo
        <View style={styles.wrapper}>
            {/* Label arriba (opcional) */}
            {label ? <Text style={styles.label}>{label}</Text> : null}
            {/* Input + error debajo (el error nunca compite en ancho con el label) */}
            <View style={styles.fieldGroup}>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={[styles.input, showEye && styles.inputWithIcon]}
                        placeholder={placeholder}
                        placeholderTextColor={colors.textPlaceholder}
                        value={value}
                        onChangeText={onChangeText}
                        secureTextEntry={showEye ? hidden : secureTextEntry}
                        keyboardType={keyboardType}
                        autoCapitalize={autoCapitalize}
                    />
                    {showEye && (
                        <TouchableOpacity
                            style={styles.eyeButton}
                            onPress={() => setHidden((prev: boolean) => !prev)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons
                                name={hidden ? 'eye-off-outline' : 'eye-outline'}
                                size={20}
                                color={colors.textPlaceholder}
                            />
                        </TouchableOpacity>
                    )}
                </View>
                {error ? <Text style={styles.errorText}>*{error}</Text> : null}
            </View>
        </View>
    );
}

function makeStyles(c: Colors) {
    return StyleSheet.create({
        // Base
        wrapper: { width: '100%', gap: 16 },

        // Label
        label: { fontSize: 14, fontWeight: 'bold', color: c.textPrimary },
        errorText: { color: c.error, fontSize: 13, fontWeight: '600' },

        // Input + error juntos (gap corto entre uno y otro)
        fieldGroup: { width: '100%', gap: 6 },
        inputContainer: { width: '100%', position: 'relative', justifyContent: 'center' },
        input: { width: '100%', height: 48, paddingHorizontal: 16, borderWidth: 1, borderColor: c.border, borderRadius: 12, backgroundColor: c.surface, fontSize: 16 },
        inputWithIcon: { paddingRight: 48 },
        eyeButton: { position: 'absolute', right: 14, height: 48, justifyContent: 'center', alignItems: 'center' },
    });
}
