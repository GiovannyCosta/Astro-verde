/*
 * services/actuatorsService.js - Regras de negocio para comandos de atuadores.
 *
 * Mantem validacoes simples de comando antes de persistir no banco JSON.
 */

function makeActuatorsService(db) {
  return {
    /* Retorna todos os atuadores cadastrados no armazenamento local. */
    getAll() {
      return db.findAll('actuators');
    },

    /*
     * Define estado da iluminacao.
     * command: "on" | "off"
     * power: 0-100
     */
    setLighting(command, power = 100) {
      if (!['on', 'off'].includes(command)) {
        throw new Error(`Comando invalido: ${command}`);
      }

      if (power < 0 || power > 100) {
        throw new Error(`Potencia invalida: ${power}`);
      }

      db.updateWhere(
        'actuators',
        (item) => item.actuator_type === 'lighting',
        { command, power_pct: power }
      );

      return { actuator: 'lighting', command, power };
    },

    /*
     * Define modo de controle termico.
     * mode: "cooling" | "heating" | "off"
     */
    setTemperatureControl(mode) {
      if (!['cooling', 'heating', 'off'].includes(mode)) {
        throw new Error(`Modo invalido: ${mode}`);
      }

      if (mode === 'cooling') {
        db.updateWhere('actuators', (item) => item.actuator_type === 'cooling', { command: 'on' });
        db.updateWhere('actuators', (item) => item.actuator_type === 'heating', { command: 'off' });
      } else if (mode === 'heating') {
        db.updateWhere('actuators', (item) => item.actuator_type === 'heating', { command: 'on' });
        db.updateWhere('actuators', (item) => item.actuator_type === 'cooling', { command: 'off' });
      } else {
        db.updateWhere(
          'actuators',
          (item) => ['cooling', 'heating'].includes(item.actuator_type),
          { command: 'off' }
        );
      }

      return { actuator: 'temperature', mode };
    },
  };
}

module.exports = makeActuatorsService;
