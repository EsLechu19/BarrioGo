import { StyleSheet, Image, Text, View } from 'react-native'
import { Negocio } from "../types/Negocio";
import { Ionicons } from "@expo/vector-icons";
import { colors } from '../styles/colors';

type Props = {
    negocio: Negocio;
}

export function RestaurantCard({ negocio }: Props) {
    return (
        <View style={styles.card}>
            <Image source={{ uri: negocio.imagen }} style={styles.restaurantImage} resizeMode="cover" />
            {/*Informacion */}
            <View style={styles.info}>
                {/* Fila 1: nombre + favorito */}
                <View style={styles.titleRow}>
                    <Text style={styles.restaurantName}>{negocio.nombre}</Text>
                    <Ionicons name='heart-outline' size={20} color={colors.textPlaceholder} />
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
        </View>
    );
}

const styles = StyleSheet.create({
    // Card del restaurante
    card: { flexDirection: 'row',alignItems:'center', gap: 12, padding: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 20, backgroundColor: colors.surface },
    restaurantImage: { width: 60, height: 60, borderRadius: 12 },

    // Informacion del restaurante
    info: { flex: 1, gap: 6 },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    restaurantName: { fontSize: 16, fontWeight: 'bold' },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    rating: { fontSize: 14, fontWeight: '600' },
    opinions: { color: colors.textMuted, fontSize: 13 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    metaText: { color: colors.textMuted, fontSize: 12 },
    freeShipping: { color: colors.success, fontSize: 12, fontWeight: '900' }
});