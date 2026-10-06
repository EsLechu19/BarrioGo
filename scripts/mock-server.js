// API local propia de BarrioGo — cero dependencias nuevas.
// Usa solo Node built-in (http) para no violar la regla de AGENTS.md.
// Sirve GET /negocios con el mismo shape de Negocio[] que usa la app.
// La data es espejo de src/data/negociosMock.ts (duplicada a propósito
// porque Node plano no importa .ts sin transpilar).
//
// Uso:
//   npm run mock-api        -> levanta http://localhost:3000
//   GET http://localhost:3000/negocios
//
// Si el servidor está apagado, la app usa el fallback local
// (ver src/services/api.ts). Así la demo nunca se cae.
const http = require('http');

const negocios = [
  {
    id: '1',
    nombre: 'Polleria Don Tito',
    imagen:
      'https://img.magnific.com/vector-premium/plantilla-vector-diseno-logotipo-mascota-pollo_441059-165.jpg?semt=ais_hybrid&w=740&q=80',
    rating: 4.6,
    opiniones: 128,
    tiempoEstimado: '15-20 min',
    distancia: '0.8 km',
    envioGratis: true,
  },
  {
    id: '2',
    nombre: 'Chifa El Dragón',
    imagen:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTK7PL9nvCC4AO4q6M7QiYztfQWqIJAIXnmxNN8zz-ICQoed7ZJOEZ9lFAF&s=10',
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
    imagen:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRgXNJgsPzLYm41MJPlizF__tQb5LYI6QvwebJ_toMCg6a0aj489CYRgkcu&s=10',
    rating: 4.1,
    opiniones: 138,
    tiempoEstimado: '5-10 min',
    distancia: '0.4 km',
    envioGratis: true,
  },
];

const PORT = process.env.MOCK_API_PORT ? Number(process.env.MOCK_API_PORT) : 3000;

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'GET' && req.url === '/negocios') {
    // Delay intencional para evidenciar loading en la app (Cap. IV)
    setTimeout(() => {
      res.writeHead(200);
      res.end(JSON.stringify(negocios));
    }, 800);
    return;
  }

  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({ ok: true, service: 'barriogo-mock-api' }));
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ message: 'Not found. Usa GET /negocios' }));
});

server.listen(PORT, () => {
  console.log(`BarrioGo mock API en http://localhost:${PORT}/negocios`);
});
