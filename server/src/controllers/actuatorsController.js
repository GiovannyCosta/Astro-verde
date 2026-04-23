/*
 * controllers/actuatorsController.js - Controller HTTP de atuadores.
 *
 * Este controller expõe os endpoints de controle de iluminacao e temperatura.
 * A regra fica no service; aqui fica apenas traducao HTTP.
 */

const { sendSuccess, sendError } = require('../utils/httpResponse');

function makeActuatorsController(actuatorsService) {
  return {
    /* GET /api/actuators - lista estado atual dos atuadores. */
    getAll(req, res) {
      try {
        const actuators = actuatorsService.getAll();
        return sendSuccess(res, 'Atuadores carregados com sucesso.', { actuators });
      } catch (err) {
        return sendError(res, err.message, 500);
      }
    },

    /*
     * POST /api/actuators/lighting - controla iluminacao.
     * Payload: { "command": "on|off", "power": 0-100 }
     */
    setLighting(req, res) {
      try {
        const { command, power } = req.body || {};
        const result = actuatorsService.setLighting(command, power);
        return sendSuccess(res, 'Comando de iluminacao aplicado.', result);
      } catch (err) {
        return sendError(res, err.message, 400);
      }
    },

    /*
     * POST /api/actuators/temperature - controla aquecimento/resfriamento.
     * Payload: { "mode": "cooling|heating|off" }
     */
    setTemperature(req, res) {
      try {
        const { mode } = req.body || {};
        const result = actuatorsService.setTemperatureControl(mode);
        return sendSuccess(res, 'Comando de temperatura aplicado.', result);
      } catch (err) {
        return sendError(res, err.message, 400);
      }
    },
  };
}

module.exports = makeActuatorsController;
