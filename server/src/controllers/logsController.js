/*
 * controllers/logsController.js — Tratamento HTTP dos Logs
 */

function makeLogsController(logsRepo) {
  return {

    /* GET /api/logs — retorna log de eventos */
    getRecent(req, res) {
      try {
        const limit = parseInt(req.query.limit) || 50;
        const logs  = logsRepo.getRecent(limit);
        res.json({ logs });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    },
  };
}

module.exports = makeLogsController;
