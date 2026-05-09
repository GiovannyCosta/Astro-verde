/**
 * @module espController
 * @description Controller HTTP do bridge ESP.
 * @hardware esp32/esp8266
 * @mode real
 */

const { sendSuccess, sendError } = require('../utils/httpResponse');

function makeEspController(espService) {
  return {
    async postData(req, res) {
      try {
        const data = await espService.ingestData(req.body);
        return sendSuccess(res, 'Leitura ESP processada.', data, 201);
      } catch (error) {
        return sendError(res, error.message, 400);
      }
    },

    async getCommands(req, res) {
      try {
        const data = await espService.getPendingCommands(req.params.device_id);
        return sendSuccess(res, 'Comandos pendentes.', { commands: data });
      } catch (error) {
        return sendError(res, error.message, 400);
      }
    },

    async postAck(req, res) {
      try {
        const data = await espService.ackCommand(req.body);
        return sendSuccess(res, 'ACK recebido.', data);
      } catch (error) {
        return sendError(res, error.message, 400);
      }
    },
  };
}

module.exports = makeEspController;
