const express = require('express');

function makeActuatorsRouter(actuatorsController) {
  const router = express.Router();

  router.get('/',             (req, res) => actuatorsController.getAll(req, res));
  router.post('/lighting',    (req, res) => actuatorsController.setLighting(req, res));
  router.post('/temperature', (req, res) => actuatorsController.setTemperature(req, res));

  return router;
}

module.exports = makeActuatorsRouter;
