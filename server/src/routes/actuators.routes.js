/*
 * routes/actuators.routes.js - Rotas de atuadores.
 *
 * Separa os endpoints de comando de dispositivos do restante da API.
 */

const express = require('express');

function makeActuatorsRouter(actuatorsController) {
  const router = express.Router();

  /* Consulta estado atual dos atuadores. */
  router.get('/', (req, res) => actuatorsController.getAll(req, res));

  /* Comando para modulo de iluminacao. */
  router.post('/lighting', (req, res) => actuatorsController.setLighting(req, res));

  /* Comando para modo de controle termico. */
  router.post('/temperature', (req, res) => actuatorsController.setTemperature(req, res));

  return router;
}

module.exports = makeActuatorsRouter;
