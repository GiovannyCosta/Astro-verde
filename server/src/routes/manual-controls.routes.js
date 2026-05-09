/**
 * @module manualControlsRoutes
 * @description Rotas de fluxo laminar e iluminacao editaveis.
 * @hardware bomba/iluminacao
 * @mode editable
 */

const express = require('express');

function makeManualControlsRouter(controller) {
  const router = express.Router();
  router.post('/fluxo', (req, res) => controller.setFluxo(req, res));
  router.post('/luz', (req, res) => controller.setLuz(req, res));
  return router;
}

module.exports = makeManualControlsRouter;
