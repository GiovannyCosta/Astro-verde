/*
 * routes/sensors.routes.js — Rotas dos Sensores
 *
 * Define os endpoints HTTP relacionados aos sensores.
 * Cada rota chama um método do controller correspondente.
 */

const express = require('express');

function makeSensorsRouter(sensorsController) {
  const router = express.Router();

  /* Última leitura dos sensores */
  router.get('/latest', (req, res) => sensorsController.getLatest(req, res));

  /* Exportar dados históricos como CSV */
  router.get('/export/csv', (req, res) => sensorsController.exportCsv(req, res));

  /*
   * Receber telemetria de hardware (ESP32/Arduino)
   * Este é o ponto de integração futura com hardware real.
   * O ESP32 deve fazer POST neste endpoint periodicamente.
   */
  router.post('/telemetry', (req, res) => sensorsController.ingestTelemetry(req, res));

  return router;
}

module.exports = makeSensorsRouter;
