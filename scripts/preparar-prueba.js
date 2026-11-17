// Prepara la demo: cuentas, dueños vinculados a su negocio y pedidos de prueba.
// Uso: 1) firebase-sdk.json en la RAÍZ (NO se sube al repo)
//      2) npm run seed (si no lo hiciste)  3) npm run preparar
// Idempotente: se puede re-ejecutar sin duplicar nada.
const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('../firebase-sdk.json');
const cuentas = require('../cuentas-prueba.json').usuarios;
const productos = require('../src/data/productos.json');
const negocios = require('../src/data/negocios.json');

initializeApp({ credential: cert(serviceAccount) });
const auth = getAuth();
const db = getFirestore();

const productosPorId = new Map(productos.map((p) => [p.id, p]));
const nombresNegocio = new Map(negocios.map((n) => [n.id, n.nombre]));

const EFECTIVO = { tipo: 'm1', nombre: 'Efectivo' };
const YAPE = { tipo: 'm2', nombre: 'Yape' };
const DIRECCION = { alias: 'Casa', detalle: 'Av. Los Cerezos 145, Lima' };

// Pedidos de prueba con ids fijos: re-ejecutar los actualiza, nunca duplica.
// Todos se fechan HOY para que Ganancias (semana actual) siempre tenga datos.
const PEDIDOS = [
  { id: 'demo-1', cliente: 'jose', negocioId: '1', hora: [9, 30], estado: 'entregado', metodo: YAPE, productos: [['p1-2', 1], ['p1-3', 1]] },
  { id: 'demo-2', cliente: 'jose', negocioId: '1', hora: [12, 15], estado: 'entregado', metodo: YAPE, productos: [['p1-1', 2]] },
  { id: 'demo-3', cliente: 'lucia', negocioId: '2', hora: [10, 45], estado: 'entregado', metodo: YAPE, productos: [['p2-3', 1]] },
  { id: 'demo-4', cliente: 'pedro', negocioId: '3', hora: [13, 0], estado: 'confirmado', metodo: EFECTIVO, productos: [['p3-1', 1], ['p3-4', 1]] },
  { id: 'demo-5', cliente: 'ana', negocioId: '4', hora: [14, 30], estado: 'pendiente', metodo: EFECTIVO, productos: [['p4-1', 2], ['p4-4', 1]] },
  { id: 'demo-6', cliente: 'diego', negocioId: '5', hora: [11, 20], estado: 'cancelado', metodo: EFECTIVO, productos: [['p5-1', 1], ['p5-3', 1]] },
  { id: 'demo-7', cliente: 'lucia', negocioId: '6', hora: [15, 0], estado: 'en_camino', metodo: YAPE, productos: [['p6-1', 2], ['p6-3', 1]] },
];

// Yape aprueba el pago en la simulación; efectivo queda pendiente de cobro.
function estadoPagoDe(metodo) {
  return metodo === YAPE ? 'pagado' : 'pendiente';
}

function fechaDeHoy(hora, minuto) {
  const d = new Date();
  d.setHours(hora, minuto, 0, 0);
  return d.toISOString();
}

function armarItems(negocioId, refs) {
  return refs.map(([productoId, cantidad]) => {
    const prod = productosPorId.get(productoId);
    if (!prod) throw new Error(`Producto ${productoId} no existe en productos.json.`);
    if (prod.negocioId !== negocioId) {
      throw new Error(`El producto ${productoId} no pertenece al negocio ${negocioId}.`);
    }
    return {
      productoId: prod.id,
      cantidad,
      precioUnitario: prod.precio,
      negocioId: prod.negocioId,
      nombre: prod.nombre,
      ...(prod.descripcion?.trim() ? { descripcion: prod.descripcion } : {}),
      ...(prod.imagen?.trim() ? { imagen: prod.imagen } : {}),
    };
  });
}

(async () => {
  // 1) Cuentas de Auth + perfil en users/{uid}.
  let creadas = 0;
  let existentes = 0;
  const uidPorCorreo = new Map();
  for (const c of cuentas) {
    let user;
    try {
      user = await auth.getUserByEmail(c.email);
      existentes += 1;
    } catch (err) {
      if (err.code !== 'auth/user-not-found') throw err;
      user = await auth.createUser({ email: c.email, password: c.password, displayName: c.nombre });
      creadas += 1;
    }
    const perfil = {
      nombre: c.nombre,
      email: c.email,
      rol: c.rol,
      createdAt: new Date().toISOString(),
    };
    if (c.negocioId) perfil.negocioId = c.negocioId;
    await db.collection('users').doc(user.uid).set(perfil, { merge: true });
    uidPorCorreo.set(c.email, user.uid);
  }

  // 2) Vincula cada dueño con su negocio y le copia la dirección como
  // ubicación de trabajo en su cuenta (merge: no pisa lo demás).
  let vinculados = 0;
  let trabajos = 0;
  for (const c of cuentas.filter((u) => u.rol === 'negocio' && u.negocioId)) {
    const ref = db.collection('negocios').doc(c.negocioId);
    const snap = await ref.get();
    if (!snap.exists) {
      console.log(`Aviso: negocio ${c.negocioId} no existe; corré npm run seed antes.`);
      continue;
    }
    await ref.set({ duenioId: uidPorCorreo.get(c.email) }, { merge: true });
    vinculados += 1;
    const negocio = snap.data();
    const lat = typeof negocio.lat === 'number' ? negocio.lat : Number.NaN;
    const lng = typeof negocio.lng === 'number' ? negocio.lng : Number.NaN;
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      await db
        .collection('users')
        .doc(uidPorCorreo.get(c.email))
        .set(
          {
            ubicacionTrabajo: {
              direccion: typeof negocio.direccion === 'string' ? negocio.direccion : '',
              lat,
              lng,
            },
          },
          { merge: true },
        );
      trabajos += 1;
    }
  }

  // 3) Pedidos de prueba (ids fijos, totales calculados desde el catálogo).
  let pedidosOk = 0;
  for (const p of PEDIDOS) {
    const negocioNombre = nombresNegocio.get(p.negocioId);
    if (!negocioNombre) throw new Error(`Negocio ${p.negocioId} no existe en negocios.json.`);
    const cliente = cuentas.find((u) => u.email === `${p.cliente}@gmail.com`);
    if (!cliente) throw new Error(`Cuenta de cliente ${p.cliente} no encontrada.`);
    const items = armarItems(p.negocioId, p.productos);
    const total = Math.round(items.reduce((acc, i) => acc + i.cantidad * i.precioUnitario, 0) * 100) / 100;
    const fecha = fechaDeHoy(p.hora[0], p.hora[1]);
    await db.collection('pedidos').doc(p.id).set(
      {
        usuarioId: uidPorCorreo.get(cliente.email),
        negocioId: p.negocioId,
        items,
        total,
        estado: p.estado,
        fecha,
        estadoPago: estadoPagoDe(p.metodo),
        direccion: DIRECCION,
        metodoPago: p.metodo,
        clienteNombre: cliente.nombre,
        negocioNombre,
        ...(p.estado === 'cancelado'
          ? { canceladoPor: uidPorCorreo.get(cliente.email), canceladoFecha: fecha }
          : {}),
      },
      { merge: true },
    );
    pedidosOk += 1;
  }

  console.log(
    `Preparación OK: ${creadas} cuentas creadas (${existentes} ya existían), ` +
      `${vinculados} negocios con dueño, ${trabajos} con dirección de trabajo, ` +
      `${pedidosOk} pedidos de prueba.`,
  );
  process.exit(0);
})().catch((err) => {
  console.error('Preparación falló:', err.message);
  process.exit(1);
});
