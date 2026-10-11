import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors } from '../styles/colors';

type Props = {
    title: string;
    onPress: () => void;
    disabled?: boolean;
};

export function PrimaryButton({ title, onPress, disabled = false }: Props) {
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

const styles = StyleSheet.create({
    // Boton principal
    button: { width: '100%', height: 48, justifyContent: 'center', alignItems: 'center', borderRadius: 24, backgroundColor: colors.primary },
    buttonText: { color: colors.surface, fontSize: 16, fontWeight: 'bold' },
    disabled: { opacity: 0.6 },
});
