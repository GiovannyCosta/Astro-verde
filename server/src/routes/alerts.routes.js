/*
 * routes/alerts.routes.js - Rotas de consulta e resolucao de alertas.
 */

const express = require('express');

function makeAlertsRouter(alertsController) {
  const router = express.Router();

  /* Lista alertas ativos. */
  router.get('/', (req, res) => alertsController.getActive(req, res));

  /* Lista historico de alertas (ativos e resolvidos). */
  router.get('/history', (req, res) => alertsController.getHistory(req, res));

  /* Resolve alerta por tipo de evento. */
  router.post('/:type/resolve', (req, res) => alertsController.resolve(req, res));

  return router;
}

module.exports = makeAlertsRouter;
