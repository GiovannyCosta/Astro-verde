/*
 * controllers/sensorsController.js - Controller HTTP de sensores.
 *
 * Responsabilidade:
 * - receber requisicoes HTTP de sensores
 * - chamar a camada de servico
 * - devolver resposta padronizada
 */

const { sendSuccess, sendError } = require('../utils/httpResponse');

function makeSensorsController(sensorsService) {
  return {
    /* GET /api/sensors/latest - leitura mais recente para dashboard. */
    getLatest(req, res) {
      try {
        const data = sensorsService.getLatestReading();
        return sendSuccess(res, 'Leitura mais recente carregada com sucesso.', data);
      } catch (err) {
        return sendError(res, err.message, 500);
      }
    },

    /*
     * POST /api/telemetry - endpoint para telemetria do ESP32.
     *
     * Payload esperado:
     * {
     *   "device_id": "astroverde-node-01",
     *   "ph": 6.18,
     *   "ec": 1.74,
     *   "temperature": 23.5,
     *   "humidity": 65,
     *   "luminosity": 820,
     *   "nft_flow": true,
     *   "is_retransmit": false
     * }
     */
    ingestTelemetry(req, res) {
      try {
        const data = sensorsService.ingestTelemetry(req.body);
        return sendSuccess(res, 'Telemetria recebida com sucesso.', data, 201);
      } catch (err) {
        return sendError(res, err.message, 400);
      }
    },

    /* GET /api/sensors/export/csv - exporta historico bruto em CSV. */
    exportCsv(req, res) {
      try {
        const rows = sensorsService.getExportData();
        const header = 'device_id,sensor_type,value,unit,quality,lighting_state,temp_control,collected_at\n';
        const body = rows.map((row) =>
          `${row.device_id},${row.sensor_type},${row.value},${row.unit},${row.quality},${row.lighting_state},${row.temp_control},${row.collected_at}`
        ).join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="astroverde-export.csv"');
        return res.send(header + body);
      } catch (err) {
        return sendError(res, err.message, 500);
      }
    },
  };
}

module.exports = makeSensorsController;
