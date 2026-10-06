// Sube el catálogo a Firestore con credencial de servidor.
// Uso: 1) descargar service-account.json de la consola (Cuentas de servicio)
//      2) guardarlo en la RAÍZ como service-account.json (NO se sube al repo)
//      3) npm run seed
const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');
const negocios = require('../src/data/negocios.json');
const productos = require('../src/data/productos.json');

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

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
