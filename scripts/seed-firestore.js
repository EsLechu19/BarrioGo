// Sube el catálogo a Firestore con credencial de servidor.
// Uso: 1) descargar service-account.json de la consola (Cuentas de servicio)
//      2) guardarlo en la RAÍZ como service-account.json (NO se sube al repo)
//      3) npm run seed
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('../service-account.json');
const negocios = require('../src/data/negocios.json');
const productos = require('../src/data/productos.json');

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

(async () => {
  const batch = db.batch();
  negocios.forEach((n) => batch.set(db.collection('negocios').doc(n.id), n));
  productos.forEach((p) => batch.set(db.collection('productos').doc(p.id), p));
  await batch.commit();
  console.log(`Seed OK: ${negocios.length} negocios, ${productos.length} productos`);
  process.exit(0);
})().catch((err) => {
  console.error('Seed falló:', err.message);
  process.exit(1);
});
