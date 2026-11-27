import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import type { RootStackParamList } from '../navigation/RootStackParamList';
import { ScreenHeader } from '../components/ScreenHeader';
import { useColors } from '../context/ThemeContext';
import type { Colors } from '../styles/colors';
import { consultarPagoMercadoPago, reconciliarPagoMercadoPago, type MercadoPagoPaymentStatus } from '../services/mercadoPago';

type Props = NativeStackScreenProps<RootStackParamList, 'PagoMercadoPago'>;

const STATUS_TEXT: Record<MercadoPagoPaymentStatus, string> = {
  creating: 'Estamos preparando el pago de prueba.',
  pending: 'El pago sigue pendiente. Puedes volver a Mercado Pago o consultar más tarde.',
  paid: 'Pago de prueba aprobado. Tus pedidos ya fueron actualizados.',
  failed: 'El pago de prueba no se completó. Los pedidos siguen disponibles para revisar.',
  creation_failed: 'No se pudo iniciar el pago de prueba.',
  review_required: 'El pago requiere revisión. No marques los pedidos como pagados; contacta al equipo de soporte.',
};

export default function PagoMercadoPagoScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [status, setStatus] = useState<MercadoPagoPaymentStatus | null>(null);
  const [statusPaymentId, setStatusPaymentId] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorPaymentId, setErrorPaymentId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [requestPaymentId, setRequestPaymentId] = useState<string | null>(null);
  const statusRequestId = useRef<number>(0);

  const fetchCurrentStatus = useCallback(async () => {
    await reconciliarPagoMercadoPago(route.params.paymentId);
    return consultarPagoMercadoPago(route.params.paymentId);
  }, [route.params.paymentId]);

  const loadStatus = useCallback(async (): Promise<void> => {
    const requestId = ++statusRequestId.current;
    setLoading(true);
    setError(null);
    try {
      const payment = await fetchCurrentStatus();
      if (requestId === statusRequestId.current) {
        setStatus(payment.status);
        setStatusPaymentId(route.params.paymentId);
        setCheckoutUrl(payment.checkoutUrl ?? null);
        setError(null);
        setErrorPaymentId(null);
      }
    } catch (e) {
      if (requestId === statusRequestId.current) {
        setError(e instanceof Error ? e.message : 'No se pudo consultar el estado.');
        setErrorPaymentId(route.params.paymentId);
      }
    } finally {
      if (requestId === statusRequestId.current) {
        setRequestPaymentId(route.params.paymentId);
        setLoading(false);
      }
    }
  }, [fetchCurrentStatus, route.params.paymentId]);

  useEffect(() => {
    const requestId = ++statusRequestId.current;
    void fetchCurrentStatus()
      .then((payment) => {
        if (requestId === statusRequestId.current) {
          setStatus(payment.status);
          setStatusPaymentId(route.params.paymentId);
          setCheckoutUrl(payment.checkoutUrl ?? null);
          setError(null);
          setErrorPaymentId(null);
        }
      })
      .catch((e: unknown) => {
        if (requestId === statusRequestId.current) {
          setError(e instanceof Error ? e.message : 'No se pudo consultar el estado.');
          setErrorPaymentId(route.params.paymentId);
        }
      })
      .finally(() => {
        if (requestId === statusRequestId.current) {
          setRequestPaymentId(route.params.paymentId);
          setLoading(false);
        }
      });
    return () => { statusRequestId.current += 1; };
  }, [fetchCurrentStatus, route.params.paymentId]);

  const currentPaymentStatus = statusPaymentId === route.params.paymentId ? status : null;
  const currentCheckoutUrl = statusPaymentId === route.params.paymentId ? checkoutUrl : null;
  const isLoading = loading || requestPaymentId !== route.params.paymentId;

  const reopenCheckout = async (): Promise<void> => {
    if (!currentCheckoutUrl) return;
    setError(null);
    setErrorPaymentId(null);
    try {
      await WebBrowser.openAuthSessionAsync(
        currentCheckoutUrl,
        `barriogo://checkout-return?paymentId=${encodeURIComponent(route.params.paymentId)}`,
      );
    } catch (e) {
      // Keep checkoutUrl available so the owner can retry opening it.
      setError(e instanceof Error ? e.message : 'No se pudo abrir Mercado Pago.');
      setErrorPaymentId(route.params.paymentId);
      return;
    }
    await loadStatus();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <ScreenHeader titulo="Pago de prueba" onBack={() => navigation.navigate('Tabs', { screen: 'PedidosTab' })} backAccessibilityLabel="Volver a pedidos" />
      <View style={styles.content}>
        {isLoading ? <ActivityIndicator color={colors.primary} size="large" /> : null}
        {currentPaymentStatus ? <Text style={styles.message}>{STATUS_TEXT[currentPaymentStatus]}</Text> : null}
        {error && errorPaymentId === route.params.paymentId ? <Text style={styles.error}>{error}</Text> : null}
        <Text style={styles.note}>El estado se confirma desde Mercado Pago; cerrar el navegador no cancela el pedido.</Text>
        <TouchableOpacity style={styles.button} onPress={() => void loadStatus()} disabled={isLoading}>
          <Text style={styles.buttonText}>{isLoading ? 'Consultando…' : 'Consultar estado'}</Text>
        </TouchableOpacity>
        {currentPaymentStatus === 'pending' && currentCheckoutUrl ? (
          <TouchableOpacity style={styles.button} onPress={() => void reopenCheckout()} disabled={isLoading}>
            <Text style={styles.buttonText}>Volver a Mercado Pago</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: colors.background },
    content: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 18 },
    message: { color: colors.textPrimary, fontSize: 18, fontWeight: '700', textAlign: 'center' },
    note: { color: colors.textMuted, textAlign: 'center' },
    error: { color: colors.error, textAlign: 'center' },
    button: { backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12 },
    buttonText: { color: colors.white, fontWeight: '800' },
  });
}
