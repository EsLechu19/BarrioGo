// Genera el menú de los negocios 17-97 reutilizando platos existentes.
// Es idempotente: borra y vuelve a crear solo los productos de esos negocios.
const fs = require('fs');
const path = require('path');

const RUTA_NEGOCIOS = path.join(__dirname, '..', 'src', 'data', 'negocios.json');
const RUTA_PRODUCTOS = path.join(__dirname, '..', 'src', 'data', 'productos.json');

const negocios = JSON.parse(fs.readFileSync(RUTA_NEGOCIOS, 'utf8'));
const productos = JSON.parse(fs.readFileSync(RUTA_PRODUCTOS, 'utf8'));
const productoPorId = new Map(productos.map((p) => [p.id, p]));

const tomar = (ids) => ids.map((id) => productoPorId.get(id));

// Plantillas por categoría. Se rotan para que no todos los negocios tengan
// exactamente el mismo menú.
const PLANTILLAS = {
  polleria: [
    ['p9-1', 'p9-2', 'p9-3', 'p9-4'],
    ['p1-1', 'p1-2', 'p1-3', 'p1-4'],
    ['p14-1', 'p14-2', 'p14-3', 'p14-4'],
  ],
  chifa: [
    ['p12-1', 'p12-2', 'p12-3', 'p12-4'],
    ['p15-1', 'p15-2', 'p15-3', 'p15-4'],
  ],
  anticuchos: [['p11-1', 'p11-2', 'p11-3', 'p11-4']],
  pizza: [
    ['p3-1', 'p3-2', 'p3-3', 'p3-4'],
    ['p8-3', 'p8-1', 'p8-4', 'p8-2'],
  ],
  broaster: [
    ['p5-1', 'p5-2', 'p5-3'],
    ['p8-2', 'p8-1', 'p8-4'],
  ],
  caldos: [['p1-1', 'p2-1', 'p15-4']],
};

const CEVICHERIA = [
  {
    nombre: 'Ceviche',
    precio: 15,
    descripcion:
      'Pescado fresco marinado en limón con camote, cancha tostada, cebolla y ají limo.',
    imagen:
      'https://cdn0.recetasgratis.net/es/posts/7/4/1/ceviche_peruano_18147_orig.jpg',
    categoriaProducto: 'Fondo',
  },
  {
    nombre: 'Chicharrón de pescado',
    precio: 30,
    descripcion:
      'Trozos de pescado frito bien crocantes, acompañados de ensalada fresca y papas.',
    imagen:
      'https://tofuu.getjusto.com/orioneat-local/resized2/9FNb6fcd7RRKcsKRn-x-1448.webp',
    categoriaProducto: 'Fondo',
  },
  {
    nombre: 'Trío marino',
    precio: 30,
    descripcion: 'Chaufa de pescado, chicharrón de pescado y ceviche de pescado.',
    imagen:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRBIIOQrZ3CHwzH3Ioq9-A3764lcCPjXesyk56Zlr-kUb917eKdUhJ_Fjg&s=10',
    categoriaProducto: 'Fondo',
  },
  {
    nombre: 'Chaufa de mariscos',
    precio: 25,
    descripcion: 'Arroz salteado al wok con mixtura de mariscos y verduras.',
    imagen:
      'https://tofuu.getjusto.com/orioneat-local/resized2/7cFsAscgEfEGLZKMk-2400-x.webp',
    categoriaProducto: 'Fondo',
  },
  {
    nombre: 'Chupe de pescado',
    precio: 26,
    descripcion: 'Sopa criolla de pescado con papas, leche, huevo y especias.',
    imagen:
      'https://tofuu.getjusto.com/orioneat-local/resized2/x95qh6SK6CTaGHg65-2400-x.webp',
    categoriaProducto: 'Fondo',
  },
];

const carta16 = productos.filter((p) => p.negocioId === '16');
const entradas16 = carta16.filter((p) => p.categoriaProducto === 'Entradas');
const menus16 = carta16.filter((p) => p.categoriaProducto === 'Menú');
const extras16 = carta16.filter((p) => p.categoriaProducto === 'Extras');

function rotar(lista, cantidad, inicio) {
  const salida = [];
  for (let i = 0; i < cantidad; i += 1) {
    salida.push(lista[(inicio + i) % lista.length]);
  }
  return salida;
}

function menuComidaCriolla(indice) {
  const entradaInicio = (indice * 4) % entradas16.length;
  const menuInicio = (indice * 6) % menus16.length;
  const extraInicio = (indice * 3) % extras16.length;
  return [
    ...rotar(entradas16, 4, entradaInicio),
    ...rotar(menus16, 6, menuInicio),
    ...rotar(extras16, 3, extraInicio),
  ];
}

const nuevos = negocios.filter((n) => Number(n.id) >= 17);
const categoriaUsada = new Map();
const productosNuevos = [];

for (const negocio of nuevos) {
  const categoria = negocio.categoria;
  const contador = categoriaUsada.get(categoria) ?? 0;
  categoriaUsada.set(categoria, contador + 1);

  let plantilla;
  if (categoria === 'comida_criolla') {
    // Carta diaria: el precio real sale de precioMenuDia/precioExtra.
    plantilla = menuComidaCriolla(contador).map((p) => ({
      ...p,
      precio: 0,
      diasSemana: undefined,
    }));
    negocio.precioMenuDia = negocio.precioMenuDia ?? 10;
    negocio.precioExtra = negocio.precioExtra ?? 15;
  } else if (categoria === 'cevicheria') {
    plantilla = CEVICHERIA;
  } else {
    const opciones = PLANTILLAS[categoria];
    if (!opciones) {
      throw new Error(`Categoría sin plantilla: ${categoria} (negocio ${negocio.id})`);
    }
    plantilla = tomar(opciones[contador % opciones.length]);
  }

  plantilla.forEach((base, indice) => {
    if (!base) {
      throw new Error(`Producto base no encontrado para el negocio ${negocio.id}`);
    }
    productosNuevos.push({
      id: `p${negocio.id}-${indice + 1}`,
      negocioId: negocio.id,
      nombre: base.nombre,
      precio: base.precio,
      ...(base.imagen ? { imagen: base.imagen } : {}),
      descripcion: base.descripcion ?? '',
      ...(base.categoriaProducto
        ? { categoriaProducto: base.categoriaProducto }
        : {}),
    });
  });
}

const productosFinales = [
  ...productos.filter((p) => Number(p.negocioId) < 17),
  ...productosNuevos,
];

const ids = new Set(productosFinales.map((p) => p.id));
if (ids.size !== productosFinales.length) {
  throw new Error('Hay IDs de producto duplicados.');
}

fs.writeFileSync(RUTA_NEGOCIOS, `${JSON.stringify(negocios, null, 2)}\n`, 'utf8');
fs.writeFileSync(
  RUTA_PRODUCTOS,
  `${JSON.stringify(productosFinales, null, 2)}\n`,
  'utf8',
);

console.log(
  `Menús generados: ${productosNuevos.length} productos para ${nuevos.length} negocios ` +
    `(total ${productosFinales.length}).`,
);
