import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View, TextInput } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Negocio } from "../types/Negocio";
import { RestaurantCard } from "../components/RestaurantCard";
import { colors } from "../styles/colors";

const negocios: Negocio[] = [
    {
        id: '1',
        nombre: 'Polleria Don Tito',
        imagen: 'https://img.magnific.com/vector-premium/plantilla-vector-diseno-logotipo-mascota-pollo_441059-165.jpg?semt=ais_hybrid&w=740&q=80',
        rating: 4.6,
        opiniones: 128,
        tiempoEstimado: '15-20 min',
        distancia: '0.8 km',
        envioGratis: true,
    },
    {
        id: '2',
        nombre: 'Chifa El Dragón',
        imagen: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTK7PL9nvCC4AO4q6M7QiYztfQWqIJAIXnmxNN8zz-ICQoed7ZJOEZ9lFAF&s=10',
        rating: 4.5,
        opiniones: 96,
        tiempoEstimado: '20-30 min',
        distancia: '1.2 km',
        envioGratis: false,
        envioMinimo: 'Envío gratis desde S/25',
    },
    {
        id: '3',
        nombre: 'Sabor Criollo',
        imagen: 'https://images.rappi.pe/restaurants_logo/1871458496846096-1774365845062.jpg',
        rating: 4.3,
        opiniones: 78,
        tiempoEstimado: '25-35 min',
        distancia: '1.8 km',
        envioGratis: false,
        envioMinimo: 'Envío gratis desde S/5',
    },
    {
        id: '4',
        nombre: 'Julitos Broaster Huarique',
        imagen: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRgXNJgsPzLYm41MJPlizF__tQb5LYI6QvwebJ_toMCg6a0aj489CYRgkcu&s=10',
        rating: 4.1,
        opiniones: 138,
        tiempoEstimado: '5-10 min',
        distancia: '0.4 km',
        envioGratis: true,
    },
];

export default function HomeScreen() {
    const insets = useSafeAreaInsets();
    const handleMore = () => { console.log('Más direcciones'); };
    const handleSeeAll = () => { console.log('Ver todos'); };
    return (
        //contenedor del home
        <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
            {/* Area del top-bar*/}
            <View style={styles.topBar}>
                {/* Locacion*/}
                <View style={styles.location}>
                    <Ionicons name='location-outline' size={30} color={colors.primary} />
                    <View style={styles.locationTextBlock}>
                        <Text style={styles.locationLabel}>Direccion de entrega</Text>
                        <View style={styles.locationRow}>
                            <Text style={styles.locationAddress}>Av. Mi casa</Text>
                            <TouchableOpacity onPress={handleMore}>
                                <Ionicons name='chevron-down' size={18} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
                {/* Notificacion*/}
                <View>
                    <Ionicons name='notifications-outline' size={30} color={colors.textSecondary} />
                </View>
            </View>

            {/*Area bienvenida y busqueda*/}
            <View style={styles.areaGreetingSearch}>
                {/* Bienvenida */}
                <View style={styles.greeting}>
                    <Text style={styles.greetingTitle}>¡Hola, Juan!👋</Text>
                    <Text style={styles.greetingSubtitle}>¿Qué se te antoja hoy?</Text>
                </View>
                {/* Busqueda */}
                <View style={styles.inputWrapper}>
                    <Ionicons name='search' size={20} color={colors.textPlaceholder} />
                    <TextInput
                        placeholder="Buscar negocios o productos"
                        placeholderTextColor={colors.textPlaceholder}
                    />
                </View>
            </View>

            {/*Area seccion header */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Negocios cercanos</Text>
                <TouchableOpacity onPress={handleSeeAll}>
                    <Text style={styles.seeAll}>Ver todos</Text>
                </TouchableOpacity>
            </View>

            {/*Area lista de restaurante*/}
            <View style={styles.restaurantList}>
                {/* CardRestaurant */}
                {negocios.map((negocio) => (
                    <RestaurantCard key={negocio.id} negocio={negocio} />
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    // Contenedor principal de la pantalla
    container: { flex: 1, gap: 20, padding: 16, backgroundColor: colors.background },

    // Area del top-bar (ubicacion + notificaciones)
    topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    location: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    locationTextBlock: { flexDirection: 'column' },
    locationLabel: { color: colors.textMuted, fontSize: 12 },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    locationAddress: { color: colors.textPrimary, fontSize: 14, fontWeight: 'bold' },

    // Area de bienvenida y busqueda
    areaGreetingSearch: { gap: 12 },
    greeting: { gap: 2 },
    greetingTitle: { color: colors.textMuted, fontSize: 15 },
    greetingSubtitle: { color: colors.textPrimary, fontSize: 22, fontWeight: '900' },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, borderWidth: 1, borderColor: colors.border, borderRadius: 22, backgroundColor: colors.surface},

    // Area seccion header (titulo + ver todos)
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    sectionTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '800' },
    seeAll: { color: colors.primary, fontSize: 14, fontWeight: '700' },

    // Area lista de restaurantes
    restaurantList: { gap: 12 }
});
