/*
 * services/sensorsService.js — Regras de Negócio dos Sensores
 *
 * A camada de service fica entre o controller e o repository.
 * Aqui ficam:
 * - validações de dados recebidos da API
 * - lógica de detecção de anomalias
 * - composição de dados de múltiplos repositórios
 *
 * O controller apenas chama o service e devolve a resposta HTTP.
 * O service não sabe que existe HTTP — ele é testável isoladamente.
 */

const config = require('../config');
const simulator = require('../mocks/sensorSimulator');

function makeSensorsService(sensorsRepo, alertsRepo, logsRepo) {
  return {

    /*
     * Retorna o estado atual dos sensores.
     * No modo mock, vem do simulador em memória.
     * No futuro, buscaria o dado mais recente do banco.
     */
    getLatestReading() {
      const state = simulator.getCurrentState();
      return {
        sensors: {
          ph:          parseFloat(state.ph.toFixed(2)),
          ec:          parseFloat(state.ec.toFixed(2)),
          tds:         Math.round(state.ec * 500),
          temperature: parseFloat(state.temperature.toFixed(1)),
          humidity:    parseFloat(state.humidity.toFixed(1)),
          luminosity:  Math.round(state.luminosity),
          waterLevel:  state.waterLevel,
          nftFlow:     state.nftFlow,
        },
        actuators: {
          lightingCommand: state.lightingCommand,
          lightingState:   state.lightingState,
          lightingPower:   state.lightingPower,
          coolingActive:   state.coolingActive,
          heatingActive:   state.heatingActive,
        },
        timestamp: new Date().toISOString(),
      };
    },

    /*
     * Recebe telemetria do ESP32 (POST /api/telemetry).
     * Valida o payload, aplica regras e persiste.
     *
     * Esta é a porta de entrada para hardware real.
     * Quando o ESP32 enviar dados, eles chegam aqui.
     */
    ingestTelemetry(payload) {
      this._validateTelemetry(payload);

      // Detecta anomalias
      const quality = this._assessQuality(payload);

      // Persiste no banco
      sensorsRepo.insert({
        device_id:      payload.device_id || 'unknown',
        sensor_type:    'telemetry',
        value:          payload.ph,
        unit:           'pH',
        quality,
        nft_flow:       payload.nft_flow ? 1 : 0,
        lighting_state: 'unknown',
        temp_control:   'unknown',
        is_retransmit:  payload.is_retransmit ? 1 : 0,
      });

      return { status: 'accepted', quality };
    },

    /*
     * Valida se o payload de telemetria tem os campos mínimos
     * e valores fisicamente possíveis.
     */
    _validateTelemetry(payload) {
      if (!payload.device_id) throw new Error('device_id obrigatório');
      if (payload.ph !== undefined && (payload.ph < 0 || payload.ph > 14)) {
        throw new Error(`pH inválido: ${payload.ph}`);
      }
      if (payload.temperature !== undefined && (payload.temperature < -10 || payload.temperature > 80)) {
        throw new Error(`Temperatura inválida: ${payload.temperature}`);
      }
    },

    /* Determina qualidade da leitura com base nos limites */
    _assessQuality(payload) {
      const limits = config.SENSOR_LIMITS;
      if (payload.ph && (payload.ph < limits.ph.min || payload.ph > limits.ph.max)) {
        return 'warning';
      }
      if (payload.ec !== undefined && payload.ec < 0.05) {
        return 'invalid'; // EC zero persistente = falha de sensor
      }
      return 'ok';
    },

    /* Exporta leituras históricas como array de objetos (para gerar CSV) */
    getExportData() {
      return sensorsRepo.exportCsv(24);
    },
  };
}

module.exports = makeSensorsService;
