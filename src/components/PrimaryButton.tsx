import { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useColors } from '../context/ThemeContext';
import type { Colors } from '../styles/colors';

type Props = {
    title: string;
    onPress: () => void;
    disabled?: boolean;
};

export function PrimaryButton({ title, onPress, disabled = false }: Props) {
    const colors = useColors();
    const styles = useMemo(() => makeStyles(colors), [colors]);
    return (
        // boton principal
        <TouchableOpacity
            style={[styles.button, disabled && styles.disabled]}
            onPress={onPress}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityState={{ disabled }}
        >
            <Text style={styles.buttonText}>{title}</Text>
        </TouchableOpacity>
    );
}

function makeStyles(c: Colors) {
    return StyleSheet.create({
        // Boton principal
        button: { width: '100%', height: 48, justifyContent: 'center', alignItems: 'center', borderRadius: 24, backgroundColor: c.primary },
        buttonText: { color: c.white, fontSize: 16, fontWeight: 'bold' },
        disabled: { opacity: 0.6 },
    });
}
