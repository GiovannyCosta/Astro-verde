/*
 * services/actuatorsService.js — Regras de Negócio dos Atuadores
 */

function makeActuatorsService(db) {
  return {

    getAll() {
      return db.findAll('actuators');
    },

    setLighting(command, power = 100) {
      if (!['on', 'off'].includes(command)) throw new Error(`Comando inválido: ${command}`);
      if (power < 0 || power > 100) throw new Error(`Potência inválida: ${power}`);

      db.updateWhere(
        'actuators',
        a => a.actuator_type === 'lighting',
        { command, power_pct: power }
      );
      return { actuator: 'lighting', command, power };
    },

    setTemperatureControl(mode) {
      if (!['cooling', 'heating', 'off'].includes(mode)) throw new Error(`Modo inválido: ${mode}`);

      if (mode === 'cooling') {
        db.updateWhere('actuators', a => a.actuator_type === 'cooling', { command: 'on'  });
        db.updateWhere('actuators', a => a.actuator_type === 'heating', { command: 'off' });
      } else if (mode === 'heating') {
        db.updateWhere('actuators', a => a.actuator_type === 'heating', { command: 'on'  });
        db.updateWhere('actuators', a => a.actuator_type === 'cooling', { command: 'off' });
      } else {
        db.updateWhere('actuators', a => ['cooling', 'heating'].includes(a.actuator_type), { command: 'off' });
      }

      return { actuator: 'temperature', mode };
    },
  };
}

module.exports = makeActuatorsService;
