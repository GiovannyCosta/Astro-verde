/**
 * @module app
 * @description Configuracao Express com bridge ESP, controles editaveis e integracao Supabase.
 * @hardware esp32/esp8266
 * @mode real
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

const config = require('./config');
const { initDatabase } = require('./database/seed');
const makeSensorsRepository = require('./repositories/sensorsRepository');
const makeAlertsRepository = require('./repositories/alertsRepository');
const makeLogsRepository = require('./repositories/logsRepository');
const makeSensorsService = require('./services/sensorsService');
const makeActuatorsService = require('./services/actuatorsService');
const makeSystemService = require('./services/systemService');
const makeSensorsController = require('./controllers/sensorsController');
const makeAlertsController = require('./controllers/alertsController');
const makeActuatorsController = require('./controllers/actuatorsController');
const makeLogsController = require('./controllers/logsController');
const makeSystemController = require('./controllers/systemController');
const makeSensorsRouter = require('./routes/sensors.routes');
const makeAlertsRouter = require('./routes/alerts.routes');
const makeActuatorsRouter = require('./routes/actuators.routes');
const makeLogsRouter = require('./routes/logs.routes');
const makeSystemRouter = require('./routes/system.routes');
const makeEspRouter = require('./routes/esp.routes');
const makeEspController = require('./controllers/espController');
const makeEspService = require('./services/espService');
const makeManualControlsService = require('./services/manualControlsService');
const makeManualControlsController = require('./controllers/manualControlsController');
const makeManualControlsRouter = require('./routes/manual-controls.routes');
const { getSupabase } = require('./integrations/supabase');
const logger = require('./services/logger');
const { sendSuccess } = require('./utils/httpResponse');

const systemState = require('./state/systemState');

function createApp() {
  const app = express();
  app.use(cors({ origin: config.CORS_ORIGINS }));
  app.use(express.json());

  const frontendPath = path.resolve(__dirname, '../../');
  app.use(express.static(frontendPath));

  const db = initDatabase();
  const sensorsRepo = makeSensorsRepository(db);
  const alertsRepo = makeAlertsRepository(db);
  const logsRepo = makeLogsRepository(db);

  const sensorsService = makeSensorsService(sensorsRepo, alertsRepo, logsRepo);
  const actuatorsService = makeActuatorsService(db);
  const systemService = makeSystemService(systemState);

  const sensorsCtrl = makeSensorsController(sensorsService);
  const alertsCtrl = makeAlertsController(alertsRepo);
  const actuatorsCtrl = makeActuatorsController(actuatorsService);
  const logsCtrl = makeLogsController(logsRepo);
  const systemCtrl = makeSystemController(systemService);

  app.use('/api/sensors', makeSensorsRouter(sensorsCtrl));
  app.post('/api/telemetry', (req, res) => sensorsCtrl.ingestTelemetry(req, res));
  app.use('/api/alerts', makeAlertsRouter(alertsCtrl));
  app.use('/api/actuators', makeActuatorsRouter(actuatorsCtrl));
  app.use('/api/logs', makeLogsRouter(logsCtrl));
  app.use('/api', makeSystemRouter(systemCtrl));

  const supabase = getSupabase();
  if (supabase) {
    const espService = makeEspService({ supabase, logger });
    const espCtrl = makeEspController(espService);
    const manualControlsService = makeManualControlsService({
      supabase,
      espService,
      logger,
      defaultDeviceId: config.ESP_DEVICE_IDS[0] || 'astro-verde-esp',
    });
    const manualControlsCtrl = makeManualControlsController(manualControlsService);

    app.use('/api/esp', makeEspRouter(espCtrl));
    app.use('/api/manual-controls', makeManualControlsRouter(manualControlsCtrl));

    setInterval(() => {
      espService.checkOfflineDevices().catch(() => {});
    }, 30000);
  }

  app.get('/api', (req, res) => {
    sendSuccess(res, 'API Astro Verde online.', { status: 'online' });
  });

  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });

  return app;
}

module.exports = createApp;
