// API local propia de BarrioGo — cero dependencias nuevas.
// Usa solo Node built-in (http) para no violar la regla de AGENTS.md.
// Sirve GET /negocios con el mismo shape de Negocio[] que usa la app.
//
// Fuente única: src/data/negocios.json (misma que la app y el seed).
//
// Uso:
//   npm run mock-api        -> levanta http://localhost:3000
//   GET http://localhost:3000/negocios
//
// Si el servidor está apagado, la app usa el siguiente origen disponible
// (ver src/services/api.ts). Así la demo nunca se cae.
const http = require('http');

const negocios = require('../src/data/negocios.json');

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
