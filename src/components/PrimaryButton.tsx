import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors } from '../styles/colors';

type Props = {
    title: string;
    onPress: () => void;
};

export function PrimaryButton({ title, onPress }: Props) {
    return (
        <TouchableOpacity style={styles.button} onPress={onPress}>
            <Text style={styles.buttonText}>{title}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: { width: '100%', height: 48, justifyContent: 'center', alignItems: 'center', borderRadius: 24, backgroundColor: colors.primary },
    buttonText: { color: colors.surface, fontSize: 16, fontWeight: 'bold' },
});
