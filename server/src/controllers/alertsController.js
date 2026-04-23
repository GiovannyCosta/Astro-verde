/*
 * controllers/alertsController.js - Controller HTTP de alertas.
 *
 * Responsavel por listar alertas ativos/historico e resolver alertas.
 */

const { sendSuccess, sendError } = require('../utils/httpResponse');

function makeAlertsController(alertsRepo) {
  return {
    /* GET /api/alerts - retorna apenas alertas ativos. */
    getActive(req, res) {
      try {
        const alerts = alertsRepo.getActive();
        return sendSuccess(res, 'Alertas ativos carregados.', {
          alerts,
          count: alerts.length,
        });
      } catch (err) {
        return sendError(res, err.message, 500);
      }
    },

    /* GET /api/alerts/history - retorna historico de alertas. */
    getHistory(req, res) {
      try {
        const limit = parseInt(req.query.limit, 10) || 100;
        const alerts = alertsRepo.getAll(limit);
        return sendSuccess(res, 'Historico de alertas carregado.', { alerts });
      } catch (err) {
        return sendError(res, err.message, 500);
      }
    },

    /* POST /api/alerts/:type/resolve - marca alerta como resolvido. */
    resolve(req, res) {
      try {
        alertsRepo.resolve(req.params.type);
        return sendSuccess(res, 'Alerta resolvido com sucesso.', {
          resolved: true,
          alertType: req.params.type,
        });
      } catch (err) {
        return sendError(res, err.message, 500);
      }
    },
  };
}

module.exports = makeAlertsController;
