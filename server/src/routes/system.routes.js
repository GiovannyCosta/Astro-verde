/*
 * routes/system.routes.js - Rotas de estado global do sistema.
 *
 * Organiza endpoints para:
 * - recepcao de pH
 * - consulta de estado atual
 * - controle simulado de bomba
 * - troca de modo simulado/real
 * - health-check
 */

const express = require('express');

function makeSystemRouter(systemController) {
  const router = express.Router();

  /* Recebe leitura de pH enviada por hardware ou cliente de teste. */
  router.post('/sensor/ph', (req, res) => systemController.receivePh(req, res));

  /* Exibe estado global em memoria. */
  router.get('/state', (req, res) => systemController.getState(req, res));

  /* Controla a bomba em modo simulacao. */
  router.post('/control/pump', (req, res) => systemController.controlPump(req, res));

  /* Alterna modo do backend entre simulacao local e integracao real. */
  router.post('/mode', (req, res) => systemController.setMode(req, res));

  /* Endpoint de saude para monitoramento do servico. */
  router.get('/health', (req, res) => systemController.health(req, res));

  return router;
}

module.exports = makeSystemRouter;
