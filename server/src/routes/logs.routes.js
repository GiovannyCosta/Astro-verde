const express = require('express');

function makeLogsRouter(logsController) {
  const router = express.Router();
  router.get('/', (req, res) => logsController.getRecent(req, res));
  return router;
}

module.exports = makeLogsRouter;
