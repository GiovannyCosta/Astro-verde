/*
 * server.js — Ponto de Entrada do Servidor Node.js
 *
 * Este arquivo:
 * 1. Cria a aplicação Express (via app.js)
 * 2. Inicia o simulador de sensores
 * 3. Abre a porta HTTP e começa a escutar
 *
 * Como executar:
 *   cd server
 *   npm install       (só na primeira vez)
 *   npm start         (produção)
 *   npm run dev       (desenvolvimento, com reload automático)
 *
 * Após iniciar, acesse:
 *   http://localhost:3001       → frontend
 *   http://localhost:3001/api   → lista de endpoints da API
 */

const createApp = require('./app');
const config    = require('./config');
const simulator = require('./mocks/sensorSimulator');
const systemState = require('./state/systemState');

/* Cria a aplicação Express com todas as dependências injetadas */
const app = createApp();

/* Inicia o simulador de sensores (gera dados e persiste no banco) */
simulator.start();

/* Inicia o simulador de pH em memoria para o modo simulado */
systemState.startSimulation();

/* Abre a porta e começa a aceitar requisições */
const server = app.listen(config.PORT, () => {
  console.log('');
  console.log('  🌱 Astro Verde — Servidor iniciado com sucesso!');
  console.log(`  → Frontend:  http://localhost:${config.PORT}`);
  console.log(`  → API:       http://localhost:${config.PORT}/api`);
  console.log(`  → Sensores:  http://localhost:${config.PORT}/api/sensors/latest`);
  console.log(`  → Alertas:   http://localhost:${config.PORT}/api/alerts`);
  console.log('');
  console.log('  Para integrar com ESP32: POST /api/telemetry');
  console.log('  Pressione Ctrl+C para parar.');
  console.log('');
});

/* Encerra o servidor e o simulador graciosamente com Ctrl+C */
process.on('SIGINT', () => {
  console.log('\n[Server] Encerrando...');
  simulator.stop();
  systemState.stopSimulation();
  server.close(() => {
    console.log('[Server] Conexões fechadas. Até logo!');
    process.exit(0);
  });
});
