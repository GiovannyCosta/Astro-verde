const express = require('express');

function makeAlertsRouter(alertsController) {
  const router = express.Router();

  router.get('/',           (req, res) => alertsController.getActive(req, res));
  router.get('/history',    (req, res) => alertsController.getHistory(req, res));
  router.post('/:type/resolve', (req, res) => alertsController.resolve(req, res));

  return router;
}

module.exports = makeAlertsRouter;
