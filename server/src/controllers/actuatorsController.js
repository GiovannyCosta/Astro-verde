/*
 * controllers/actuatorsController.js — Tratamento HTTP dos Atuadores
 */

function makeActuatorsController(actuatorsService) {
  return {

    /* GET /api/actuators — lista estado de todos os atuadores */
    getAll(req, res) {
      try {
        const actuators = actuatorsService.getAll();
        res.json({ actuators });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    },

    /* POST /api/actuators/lighting — controla a iluminação */
    setLighting(req, res) {
      try {
        const { command, power } = req.body;
        const result = actuatorsService.setLighting(command, power);
        res.json(result);
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    },

    /* POST /api/actuators/temperature — controla temperatura */
    setTemperature(req, res) {
      try {
        const { mode } = req.body;
        const result = actuatorsService.setTemperatureControl(mode);
        res.json(result);
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    },
  };
}

module.exports = makeActuatorsController;
