import type { FlatListProps } from 'react-native';

// Fase 4: props de rendimiento compartidas por las FlatList de la app.
// Pocos ítems visibles por lote, ventana acotada y recorte de lo que está
// fuera de pantalla: menos re-render y mejor scroll con imágenes.
export const LIST_PERF: Pick<
  FlatListProps<unknown>,
  | 'initialNumToRender'
  | 'maxToRenderPerBatch'
  | 'updateCellsBatchingPeriod'
  | 'windowSize'
  | 'removeClippedSubviews'
> = {
  initialNumToRender: 6,
  maxToRenderPerBatch: 8,
  updateCellsBatchingPeriod: 50,
  windowSize: 7,
  removeClippedSubviews: true,
};
