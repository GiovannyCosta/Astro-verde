/*
 * controllers/alertsController.js — Tratamento HTTP dos Alertas
 */

function makeAlertsController(alertsRepo) {
  return {

    /* GET /api/alerts — retorna alertas ativos */
    getActive(req, res) {
      try {
        const alerts = alertsRepo.getActive();
        res.json({ alerts, count: alerts.length });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    },

    /* GET /api/alerts/history — histórico completo */
    getHistory(req, res) {
      try {
        const limit  = parseInt(req.query.limit) || 100;
        const alerts = alertsRepo.getAll(limit);
        res.json({ alerts });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    },

    /* POST /api/alerts/:type/resolve — fecha um alerta */
    resolve(req, res) {
      try {
        alertsRepo.resolve(req.params.type);
        res.json({ resolved: true, alertType: req.params.type });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    },
  };
}

module.exports = makeAlertsController;
