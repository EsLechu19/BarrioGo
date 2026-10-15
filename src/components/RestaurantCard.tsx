import { useMemo } from 'react';
import { StyleSheet, Image, Text, TouchableOpacity, View } from 'react-native'
import { Negocio } from "../types/Negocio";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from '../context/ThemeContext';
import type { Colors } from '../styles/colors';

type Props = {
    negocio: Negocio;
    esFavorito: boolean;
    onToggleFavorito: () => void;
    onPress?: () => void;
}

export function RestaurantCard({ negocio, esFavorito, onToggleFavorito, onPress }: Props) {
    const colors = useColors();
    const styles = useMemo(() => makeStyles(colors), [colors]);
    // uri vacía ('') rompe <Image>: solo se renderiza con URL real.
    const foto: string | null =
        negocio.portada?.trim() ? negocio.portada
        : negocio.imagen?.trim() ? negocio.imagen
        : null;
    return (
        // contenedor de la card
        <View style={styles.card}>
            {/* Area contenido: navega a Detalle. El corazón queda fuera para no anidar touchables. */}
            <TouchableOpacity
                style={styles.mainPress}
                activeOpacity={0.85}
                onPress={onPress}
                accessibilityRole="button"
                accessibilityLabel={`Ver ${negocio.nombre}`}
            >
                {/* Foto */}
                {/* Portada si existe, con fallback al icono (S3 apf6-negocio-propio). */}
                {foto ? (
                    <Image source={{ uri: foto }} style={styles.restaurantImage} resizeMode="cover" />
                ) : (
                    <View style={[styles.restaurantImage, styles.placeholder]}>
                        <Ionicons name='storefront-outline' size={28} color={colors.textPlaceholder} />
                    </View>
                )}
                {/*Informacion */}
                <View style={styles.info}>
                    {/* Fila 1: nombre */}
                    <View style={styles.titleRow}>
                        <Text style={styles.restaurantName}>{negocio.nombre}</Text>
                    </View>
                    {/* Fila 2: rating */}
                    <View style={styles.ratingRow}>
                        <Ionicons name='star-outline' size={20} color={colors.rating} />
                        <Text style={styles.rating}>{negocio.rating}</Text>
                        <Text style={styles.opinions}>({negocio.opiniones} opiniones)</Text>
                    </View>
                    {/* Fila 3: tiempo / distancia / envío */}
                    <View style={styles.metaRow}>
                        <Text style={styles.metaText}>{negocio.tiempoEstimado}</Text>
                        <Text style={styles.metaText}>•</Text>
                        <Text style={styles.metaText}>{negocio.distancia}</Text>
                        <Text style={styles.metaText}>•</Text>
                        {negocio.envioGratis?(
                            <Text style={styles.freeShipping}>Envío gratis</Text>
                        ):(
                            <Text style={styles.freeShipping}>{negocio.envioMinimo}</Text>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
            {/* Area favorito */}
            <TouchableOpacity
                onPress={onToggleFavorito}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={esFavorito ? `Quitar ${negocio.nombre} de favoritos` : `Guardar ${negocio.nombre} en favoritos`}
                style={styles.favButton}
            >
                <Ionicons
                    name={esFavorito ? 'heart' : 'heart-outline'}
                    size={20}
                    color={esFavorito ? colors.primary : colors.textPlaceholder}
                />
            </TouchableOpacity>
        </View>
    );
}

function makeStyles(c: Colors) {
    return StyleSheet.create({
        // Card
        card: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, borderWidth: 1, borderColor: c.border, borderRadius: 16, backgroundColor: c.surface },

        // Area contenido
        mainPress: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },

        // Foto
        restaurantImage: { width: 60, height: 60, borderRadius: 12 },
        placeholder: { justifyContent: 'center', alignItems: 'center', backgroundColor: c.background },

        // Area info
        info: { flex: 1, gap: 6 },
        // Fila 1: nombre
        titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
        restaurantName: { fontSize: 16, fontWeight: 'bold', color: c.textPrimary },
        // Fila 2: rating
        ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
        rating: { fontSize: 14, fontWeight: '600', color: c.textPrimary },
        opinions: { color: c.textMuted, fontSize: 13 },
        // Fila 3: tiempo / distancia / envío
        metaRow: { flexDirection: 'row', alignItems: 'center',flexWrap:'wrap', gap: 8 },
        metaText: { color: c.textMuted, fontSize: 12 },
        freeShipping: { color: c.success, fontSize: 12, fontWeight: '900' },

        // Area favorito
        favButton: { padding: 4 },
    });
}