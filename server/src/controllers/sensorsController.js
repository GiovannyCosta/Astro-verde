/*
 * controllers/sensorsController.js — Tratamento HTTP dos Sensores
 *
 * O controller é a camada mais próxima do HTTP.
 * Responsabilidades:
 * - receber req (request)
 * - chamar o service correto
 * - responder com res (response) em JSON
 * - tratar erros HTTP (400, 404, 500)
 *
 * O controller NÃO contém lógica de negócio — ela fica no service.
 */

function makeSensorsController(sensorsService) {
  return {

    /* GET /api/sensors/latest — retorna estado atual dos sensores */
    getLatest(req, res) {
      try {
        const data = sensorsService.getLatestReading();
        res.json(data);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    },

    /*
     * POST /api/telemetry — recebe dados do ESP32/Arduino
     *
     * Payload esperado:
     * {
     *   "device_id": "astroverde-node-01",
     *   "ph": 6.18,
     *   "ec": 1.74,
     *   "tds": 870,
     *   "temperature": 23.5,
     *   "humidity": 65,
     *   "luminosity": 820,
     *   "nft_flow": true,
     *   "is_retransmit": false
     * }
     */
    ingestTelemetry(req, res) {
      try {
        const result = sensorsService.ingestTelemetry(req.body);
        res.status(201).json(result);
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    },

    /* GET /api/sensors/export/csv — exporta dados históricos */
    exportCsv(req, res) {
      try {
        const rows = sensorsService.getExportData();

        // Gera CSV manualmente (sem dependência extra)
        const header = 'device_id,sensor_type,value,unit,quality,lighting_state,temp_control,collected_at\n';
        const body   = rows.map(r =>
          `${r.device_id},${r.sensor_type},${r.value},${r.unit},${r.quality},${r.lighting_state},${r.temp_control},${r.collected_at}`
        ).join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="astroverde-export.csv"');
        res.send(header + body);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    },
  };
}

module.exports = makeSensorsController;
