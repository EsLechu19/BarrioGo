// Sube el catálogo a Firestore con credencial de servidor.
// Uso: 1) descargar la credencial de la consola (Cuentas de servicio)
//      2) guardarla en la RAÍZ como firebase-sdk.json
//         (NO se sube al repo)
//      3) npm run seed
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('../firebase-sdk.json');
const negocios = require('../src/data/negocios.json');
const productos = require('../src/data/productos.json');

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// Firestore permite máximo 500 escrituras por batch; dejamos margen.
const ESCRITURAS_POR_LOTE = 450;

async function subirColeccion(nombre, documentos) {
  for (let i = 0; i < documentos.length; i += ESCRITURAS_POR_LOTE) {
    const batch = db.batch();
    for (const documento of documentos.slice(i, i + ESCRITURAS_POR_LOTE)) {
      batch.set(db.collection(nombre).doc(documento.id), documento, {
        merge: true,
      });
    }
    await batch.commit();
  }
}

(async () => {
  await subirColeccion('negocios', negocios);
  await subirColeccion('productos', productos);
  console.log(`Seed OK: ${negocios.length} negocios, ${productos.length} productos`);
  process.exit(0);
})().catch((err) => {
  console.error('Seed falló:', err.message);
  process.exit(1);
});
