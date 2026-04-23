/*
 * routes/sensors.routes.js - Rotas de leitura e exportacao de sensores.
 *
 * Inclui endpoint de telemetria para integracao com ESP32.
 */

const express = require('express');

function makeSensorsRouter(sensorsController) {
  const router = express.Router();

  /* Ultima leitura consolidada para atualizar dashboard. */
  router.get('/latest', (req, res) => sensorsController.getLatest(req, res));

  /* Exporta historico bruto em CSV para analise externa. */
  router.get('/export/csv', (req, res) => sensorsController.exportCsv(req, res));

  /*
   * Endpoint de telemetria para camada fisica (ESP32).
   * O microcontrolador envia pacote de sensores por POST.
   */
  router.post('/telemetry', (req, res) => sensorsController.ingestTelemetry(req, res));

  return router;
}

module.exports = makeSensorsRouter;
