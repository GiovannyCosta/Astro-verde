/*
 * state/systemState.js - Estado central do backend para integracao fisica.
 *
 * Este modulo guarda o estado principal em memoria:
 * - phAtual
 * - bombaLigada
 * - modoAtual ("simulado" ou "real")
 * - ultimaAtualizacao
 * - origemLeitura ("simulada" ou "hardware")
 *
 * O foco aqui e manter dados de runtime simples, sem banco.
 */

const { calculatePumpStateByPh } = require('../services/pumpAutomationService');

const SIMULATION_INTERVAL_MS = 3000;
const SIMULATED_PH_MIN = 5.5;
const SIMULATED_PH_MAX = 8.5;

const state = {
  phAtual: 6.5,
  bombaLigada: false,
  modoAtual: 'simulado',
  ultimaAtualizacao: new Date().toISOString(),
  origemLeitura: 'simulada',
};

let simulationTimer = null;

/* Gera timestamp ISO para padronizar as respostas da API. */
function nowTimestamp() {
  return new Date().toISOString();
}

/* Valida pH dentro da faixa fisica suportada. */
function assertValidPh(ph) {
  if (typeof ph !== 'number' || Number.isNaN(ph)) {
    throw new Error('Campo "ph" deve ser um numero.');
  }

  if (ph < 0 || ph > 14) {
    throw new Error('Campo "ph" deve estar entre 0 e 14.');
  }
}

/* Valida modo de operacao permitido no sistema. */
function assertValidMode(mode) {
  if (!['simulado', 'real'].includes(mode)) {
    throw new Error('Modo invalido. Use "simulado" ou "real".');
  }
}

/* Atualiza somente o carimbo temporal de alteracao do estado. */
function touchUpdateTimestamp() {
  state.ultimaAtualizacao = nowTimestamp();
}

/* Retorna copia segura do estado completo para leitura externa. */
function getStateSnapshot() {
  return {
    phAtual: state.phAtual,
    bombaLigada: state.bombaLigada,
    modoAtual: state.modoAtual,
    ultimaAtualizacao: state.ultimaAtualizacao,
    origemLeitura: state.origemLeitura,
  };
}

/* Retorna o pH atual em memoria. */
function getPhAtual() {
  return state.phAtual;
}

/* Retorna estado atual da bomba. */
function getBombaLigada() {
  return state.bombaLigada;
}

/* Retorna o modo de operacao atual. */
function getModoAtual() {
  return state.modoAtual;
}

/* Alias para compatibilidade com codigo antigo. */
function getModo() {
  return getModoAtual();
}

/* Retorna origem da ultima leitura aplicada ao estado. */
function getOrigemLeitura() {
  return state.origemLeitura;
}

/* Retorna timestamp da ultima alteracao. */
function getUltimaAtualizacao() {
  return state.ultimaAtualizacao;
}

/*
 * Atualiza estado manual da bomba.
 * Use updateTimestamp=false quando a bomba for recalculada junto do mesmo update de pH.
 */
function setBombaLigada(ligar, options = {}) {
  if (typeof ligar !== 'boolean') {
    throw new Error('Campo "ligar" deve ser true ou false.');
  }

  const { updateTimestamp = true } = options;
  state.bombaLigada = ligar;
  if (updateTimestamp) touchUpdateTimestamp();
  return state.bombaLigada;
}

/* Ajusta o modo de operacao (simulado/real). */
function setModoAtual(mode) {
  assertValidMode(mode);
  state.modoAtual = mode;
  touchUpdateTimestamp();
  return state.modoAtual;
}

/* Alias para compatibilidade com codigo antigo. */
function setModo(mode) {
  return setModoAtual(mode);
}

/*
 * Atualiza leitura de pH no estado global.
 * Ao receber novo pH, recalcula automaticamente o estado da bomba.
 */
function setPhAtual(ph, source = 'hardware') {
  assertValidPh(ph);
  state.phAtual = ph;
  state.origemLeitura = source;
  touchUpdateTimestamp();
  setBombaLigada(calculatePumpStateByPh(ph), { updateTimestamp: false });
  return state.phAtual;
}

/* Gera pH aleatorio da faixa de simulacao local. */
function generateSimulatedPh() {
  const rawValue = Math.random() * (SIMULATED_PH_MAX - SIMULATED_PH_MIN) + SIMULATED_PH_MIN;
  return Number(rawValue.toFixed(2));
}

/*
 * Recebe leitura de pH enviada para API.
 * - modo real: usa pH recebido e marca origem hardware.
 * - modo simulado: ignora pH recebido e substitui por leitura simulada.
 */
function ingestPhReading(ph) {
  if (state.modoAtual === 'real') {
    setPhAtual(ph, 'hardware');
    return { phUsado: state.phAtual, origemLeitura: state.origemLeitura };
  }

  const simulatedPh = generateSimulatedPh();
  setPhAtual(simulatedPh, 'simulada');
  return { phUsado: simulatedPh, origemLeitura: state.origemLeitura };
}

/*
 * Inicia simulacao local em memoria.
 * A cada 3 segundos, se o modo estiver em "simulado", novo pH e aplicado.
 */
function startSimulation() {
  if (simulationTimer) return;

  simulationTimer = setInterval(() => {
    if (state.modoAtual !== 'simulado') return;
    setPhAtual(generateSimulatedPh(), 'simulada');
  }, SIMULATION_INTERVAL_MS);
}

/* Interrompe simulacao local para encerramento limpo do servidor. */
function stopSimulation() {
  if (!simulationTimer) return;
  clearInterval(simulationTimer);
  simulationTimer = null;
}

module.exports = {
  getStateSnapshot,
  getPhAtual,
  setPhAtual,
  getBombaLigada,
  setBombaLigada,
  getModoAtual,
  setModoAtual,
  getModo,
  setModo,
  getOrigemLeitura,
  getUltimaAtualizacao,
  generateSimulatedPh,
  ingestPhReading,
  startSimulation,
  stopSimulation,
};
