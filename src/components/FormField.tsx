import { StyleSheet, Text, View, TextInput, KeyboardTypeOptions } from 'react-native';
import { colors } from '../styles/colors';

type Props = {
    label: string;
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
    return (
        <View style={styles.wrapper}>
            <View style={styles.labelRow}>
                <Text style={styles.label}>{label}</Text>
                {error && <Text style={styles.errorAsterisk}>*{error}</Text>}
            </View>
            <TextInput
                style={styles.input}
                placeholder={placeholder}
                placeholderTextColor={colors.textPlaceholder}
                value={value}
                onChangeText={onChangeText}
                secureTextEntry={secureTextEntry}
                keyboardType={keyboardType}
                autoCapitalize={autoCapitalize}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: { width: '100%', gap: 16 },
    labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    label: { fontSize: 14, fontWeight: 'bold' },
    errorAsterisk: { color: colors.error, fontSize: 13, fontWeight: '600' },
    input: { width: '100%', height: 48, paddingHorizontal: 16, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.surface, fontSize: 16 },
});
