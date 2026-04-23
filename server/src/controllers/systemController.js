/*
 * controllers/systemController.js - Controller HTTP do estado global.
 *
 * Este arquivo traduz req/res HTTP para chamadas da camada de servico.
 * Nao contem regras de negocio diretamente.
 */

const { sendSuccess, sendError } = require('../utils/httpResponse');

function makeSystemController(systemService) {
  return {
    /*
     * POST /api/sensor/ph
     * Endpoint planejado para o ESP32 enviar leitura de pH.
     *
     * Payload esperado:
     * {
     *   "ph": 6.4,
     *   "deviceId": "esp32-torre-a" // opcional
     * }
     */
    receivePh(req, res) {
      try {
        const data = systemService.receivePh(req.body);
        return sendSuccess(res, 'Leitura de pH processada com sucesso.', data);
      } catch (err) {
        return sendError(res, err.message, 400);
      }
    },

    /*
     * GET /api/state
     * Retorna o estado atual em memoria para dashboard e diagnostico.
     */
    getState(req, res) {
      try {
        const data = systemService.getState();
        return sendSuccess(res, 'Estado atual carregado com sucesso.', data);
      } catch (err) {
        return sendError(res, err.message, 500);
      }
    },

    /*
     * POST /api/control/pump
     * Altera estado da bomba de forma simulada (sem hardware real neste momento).
     */
    controlPump(req, res) {
      try {
        const data = systemService.setPump(req.body);
        return sendSuccess(res, 'Estado da bomba atualizado com sucesso.', data);
      } catch (err) {
        return sendError(res, err.message, 400);
      }
    },

    /*
     * POST /api/mode
     * Endpoint para alternar entre simulacao local e modo real (hardware).
     *
     * Payload esperado:
     * {
     *   "modo": "simulado" | "real"
     * }
     */
    setMode(req, res) {
      try {
        const data = systemService.setMode(req.body);
        return sendSuccess(res, 'Modo do sistema atualizado com sucesso.', data);
      } catch (err) {
        return sendError(res, err.message, 400);
      }
    },

    /*
     * GET /api/health
     * Endpoint simples para health-check de infraestrutura.
     */
    health(req, res) {
      try {
        const data = systemService.getHealth();
        return sendSuccess(res, 'Servico online.', data);
      } catch (err) {
        return sendError(res, err.message, 500);
      }
    },
  };
}

module.exports = makeSystemController;
