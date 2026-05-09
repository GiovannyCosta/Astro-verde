/**
 * @module espRoutes
 * @description Rotas do bridge ESP para telemetria e fila de comandos.
 * @hardware esp32/esp8266
 * @mode real
 */

const express = require('express');

function makeEspRouter(espController) {
  const router = express.Router();
  router.post('/data', (req, res) => espController.postData(req, res));
  router.get('/commands/:device_id', (req, res) => espController.getCommands(req, res));
  router.post('/ack', (req, res) => espController.postAck(req, res));
  return router;
}

module.exports = makeEspRouter;
