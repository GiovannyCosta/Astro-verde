/**
 * @module manualControlsController
 * @description Controller HTTP dos controles editaveis.
 * @hardware bomba/iluminacao
 * @mode editable
 */

const { sendSuccess, sendError } = require('../utils/httpResponse');

function makeManualControlsController(service) {
  return {
    async setFluxo(req, res) {
      try {
        const data = await service.saveFluxo(Number(req.body?.valor));
        return sendSuccess(res, 'Fluxo salvo com sucesso.', data);
      } catch (error) {
        return sendError(res, error.message, 400);
      }
    },
    async setLuz(req, res) {
      try {
        const data = await service.saveIluminacao(req.body || {});
        return sendSuccess(res, 'Iluminacao salva com sucesso.', data);
      } catch (error) {
        return sendError(res, error.message, 400);
      }
    },
  };
}

module.exports = makeManualControlsController;
