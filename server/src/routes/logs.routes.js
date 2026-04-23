/*
 * routes/logs.routes.js - Rotas do historico operacional do sistema.
 */

const express = require('express');

function makeLogsRouter(logsController) {
  const router = express.Router();

  /* Lista eventos recentes para diagnostico e auditoria local. */
  router.get('/', (req, res) => logsController.getRecent(req, res));

  return router;
}

module.exports = makeLogsRouter;
