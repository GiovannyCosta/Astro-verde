/*
 * services/pumpAutomationService.js - Regra de automacao da bomba por pH.
 *
 * Este arquivo isola a regra principal para facilitar manutencao futura:
 * - se pH > 7, bomba ligada
 * - se pH <= 7, bomba desligada
 *
 * Mantendo a regra aqui, a rota/controller nao precisa saber detalhes.
 */

/* Decide se a bomba deve ficar ligada para um determinado valor de pH. */
function calculatePumpStateByPh(phValue) {
  return phValue > 7;
}

module.exports = {
  calculatePumpStateByPh,
};
