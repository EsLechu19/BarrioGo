import { useMemo, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CategoriaNegocio } from '../types/Negocio';
import { CATEGORIAS_NEGOCIO, labelDeCategoria } from '../utils/cartaDiaria';
import { useColors } from '../context/ThemeContext';
import type { Colors } from '../styles/colors';

// Combobox de categoría del negocio (registro y Mi local): campo que al
// tocarlo abre una lista modal con las 12 categorías reales + "Otro".
type Props = {
    label?: string;
    valor: CategoriaNegocio | null;
    onChange: (categoria: CategoriaNegocio) => void;
    error?: string;
};

export function SelectorCategoria({ label, valor, onChange, error }: Props) {
    const colors = useColors();
    const styles = useMemo(() => makeStyles(colors), [colors]);
    const [abierto, setAbierto] = useState<boolean>(false);

    return (
        <View style={styles.wrapper}>
            {label ? <Text style={styles.label}>{label}</Text> : null}
            <TouchableOpacity
                style={styles.campo}
                onPress={() => setAbierto(true)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={`Categoría: ${valor ? labelDeCategoria(valor) : 'sin elegir'}`}
            >
                <Text
                    style={[styles.valorText, !valor && styles.valorVacio]}
                    numberOfLines={1}
                >
                    {valor ? labelDeCategoria(valor) : 'Elegí una categoría'}
                </Text>
                <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
            </TouchableOpacity>
            {error ? <Text style={styles.errorText}>*{error}</Text> : null}

            <Modal
                visible={abierto}
                transparent
                animationType="fade"
                onRequestClose={() => setAbierto(false)}
            >
                <TouchableOpacity
                    style={styles.backdrop}
                    activeOpacity={1}
                    onPress={() => setAbierto(false)}
                >
                    {/* StopPropagation: tocar la lista no cierra el modal. */}
                    <TouchableOpacity style={styles.lista} activeOpacity={1}>
                        <Text style={styles.listaTitulo}>Categoría del negocio</Text>
                        {CATEGORIAS_NEGOCIO.map((cat) => {
                            const activa: boolean = cat.valor === valor;
                            return (
                                <TouchableOpacity
                                    key={cat.valor}
                                    style={[styles.opcion, activa && styles.opcionActiva]}
                                    onPress={() => {
                                        onChange(cat.valor);
                                        setAbierto(false);
                                    }}
                                    accessibilityRole="button"
                                    accessibilityState={{ selected: activa }}
                                >
                                    <Text
                                        style={[styles.opcionText, activa && styles.opcionTextActiva]}
                                    >
                                        {cat.label}
                                    </Text>
                                    {activa ? (
                                        <Ionicons name="checkmark" size={18} color={colors.primary} />
                                    ) : null}
                                </TouchableOpacity>
                            );
                        })}
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

function makeStyles(c: Colors) {
    return StyleSheet.create({
        wrapper: { width: '100%', gap: 6 },
        label: { fontSize: 14, fontWeight: 'bold', color: c.textPrimary },
        campo: {
            width: '100%',
            height: 48,
            paddingHorizontal: 16,
            borderWidth: 1,
            borderColor: c.border,
            borderRadius: 12,
            backgroundColor: c.surface,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
        },
        valorText: { flex: 1, fontSize: 16, color: c.textPrimary },
        valorVacio: { color: c.textPlaceholder },
        errorText: { color: c.error, fontSize: 13, fontWeight: '600' },

        backdrop: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.45)',
            justifyContent: 'center',
            paddingHorizontal: 24,
        },
        lista: {
            width: '100%',
            maxHeight: '80%',
            paddingVertical: 8,
            borderRadius: 16,
            backgroundColor: c.surface,
            borderWidth: 1,
            borderColor: c.border,
        },
        listaTitulo: {
            color: c.textMuted,
            fontSize: 13,
            fontWeight: '700',
            paddingHorizontal: 16,
            paddingVertical: 8,
        },
        opcion: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 12,
        },
        opcionActiva: { backgroundColor: c.primarySoft },
        opcionText: { fontSize: 15, fontWeight: '600', color: c.textPrimary },
        opcionTextActiva: { color: c.primary },
    });
}
