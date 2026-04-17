/*
 * app.js — Configuração do Express (Aplicação HTTP)
 *
 * Este arquivo configura o Express: middlewares, rotas e
 * instância de todos os módulos (Dependency Injection manual).
 *
 * Por que separar app.js de server.js?
 * server.js faz o .listen() (abre a porta).
 * app.js configura a lógica.
 * Essa separação facilita testes: os testes importam app.js
 * sem precisar abrir uma porta real.
 *
 * Dependency Injection:
 * Criamos o banco → criamos os repos → criamos os services
 * → criamos os controllers → registramos as rotas.
 * Cada camada recebe suas dependências como parâmetro,
 * não importa diretamente — facilita testes e troca de banco.
 */

const express = require('express');
const cors    = require('cors');
const path    = require('path');

const config    = require('./config');

/* --- Banco de dados --- */
const { initDatabase } = require('./database/seed');

/* --- Repositórios --- */
const makeSensorsRepository   = require('./repositories/sensorsRepository');
const makeAlertsRepository    = require('./repositories/alertsRepository');
const makeLogsRepository      = require('./repositories/logsRepository');

/* --- Services --- */
const makeSensorsService   = require('./services/sensorsService');
const makeActuatorsService = require('./services/actuatorsService');

/* --- Controllers --- */
const makeSensorsController   = require('./controllers/sensorsController');
const makeAlertsController    = require('./controllers/alertsController');
const makeActuatorsController = require('./controllers/actuatorsController');
const makeLogsController      = require('./controllers/logsController');

/* --- Rotas --- */
const makeSensorsRouter   = require('./routes/sensors.routes');
const makeAlertsRouter    = require('./routes/alerts.routes');
const makeActuatorsRouter = require('./routes/actuators.routes');
const makeLogsRouter      = require('./routes/logs.routes');

function createApp() {
  const app = express();

  /* --- Middlewares globais --- */

  /* CORS: permite chamadas do browser (frontend em outro arquivo/porta) */
  app.use(cors({ origin: config.CORS_ORIGINS }));

  /* Parse de JSON no body das requisições */
  app.use(express.json());

  /* Serve arquivos estáticos do frontend (pasta raiz do projeto) */
  const frontendPath = path.resolve(__dirname, '../../');
  app.use(express.static(frontendPath));

  /* --- Inicialização do banco --- */
  const db = initDatabase();

  /* --- Instância dos repositórios --- */
  const sensorsRepo   = makeSensorsRepository(db);
  const alertsRepo    = makeAlertsRepository(db);
  const logsRepo      = makeLogsRepository(db);

  /* --- Instância dos services --- */
  const sensorsService   = makeSensorsService(sensorsRepo, alertsRepo, logsRepo);
  const actuatorsService = makeActuatorsService(db);

  /* --- Instância dos controllers --- */
  const sensorsCtrl   = makeSensorsController(sensorsService);
  const alertsCtrl    = makeAlertsController(alertsRepo);
  const actuatorsCtrl = makeActuatorsController(actuatorsService);
  const logsCtrl      = makeLogsController(logsRepo);

  /* --- Registro das rotas --- */
  app.use('/api/sensors',    makeSensorsRouter(sensorsCtrl));

  /*
   * POST /api/telemetry — ponto de entrada direto para o ESP32
   * O ESP32 envia dados aqui. O mesmo handler de ingestão é usado.
   * Separado do router de sensores para ter uma URL limpa.
   */
  app.post('/api/telemetry', (req, res) => sensorsCtrl.ingestTelemetry(req, res));
  app.use('/api/alerts',     makeAlertsRouter(alertsCtrl));
  app.use('/api/actuators',  makeActuatorsRouter(actuatorsCtrl));
  app.use('/api/logs',       makeLogsRouter(logsCtrl));

  /* --- Rota raiz da API --- */
  app.get('/api', (req, res) => {
    res.json({
      name:    'Astro Verde API',
      version: '1.0.0',
      status:  'online',
      endpoints: [
        'GET  /api/sensors/latest',
        'GET  /api/sensors/export/csv',
        'POST /api/telemetry',
        'GET  /api/alerts',
        'GET  /api/alerts/history',
        'POST /api/alerts/:type/resolve',
        'GET  /api/actuators',
        'POST /api/actuators/lighting',
        'POST /api/actuators/temperature',
        'GET  /api/logs',
      ],
    });
  });

  /* --- Fallback: serve o frontend para qualquer rota não-API --- */
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });

  return app;
}

module.exports = createApp;
