/*
 * services/sensorsService.js - Regras de negocio das leituras de sensores.
 *
 * Esta camada:
 * - valida payload recebido via telemetria
 * - classifica qualidade da leitura
 * - persiste leitura no repositorio
 * - registra logs e alertas de apoio operacional
 */

const config = require('../config');
const simulator = require('../mocks/sensorSimulator');

function makeSensorsService(sensorsRepo, alertsRepo, logsRepo) {
  return {
    /*
     * Retorna estado consolidado dos sensores/atuadores para o dashboard.
     * Enquanto hardware real nao estiver conectado, os dados vem do simulador.
     */
    getLatestReading() {
      const state = simulator.getCurrentState();

      return {
        sensors: {
          ph: Number(state.ph.toFixed(2)),
          ec: Number(state.ec.toFixed(2)),
          tds: Math.round(state.ec * 500),
          temperature: Number(state.temperature.toFixed(1)),
          humidity: Number(state.humidity.toFixed(1)),
          luminosity: Math.round(state.luminosity),
          waterLevel: state.waterLevel,
          nftFlow: state.nftFlow,
        },
        actuators: {
          lightingCommand: state.lightingCommand,
          lightingState: state.lightingState,
          lightingPower: state.lightingPower,
          coolingActive: state.coolingActive,
          heatingActive: state.heatingActive,
        },
        timestamp: new Date().toISOString(),
      };
    },

    /*
     * Recebe pacote de telemetria do ESP32.
     * Guarda leitura bruta e marca qualidade para analise posterior.
     */
    ingestTelemetry(payload = {}) {
      this._validateTelemetry(payload);
      const quality = this._assessQuality(payload);

      sensorsRepo.insert({
        device_id: payload.device_id || 'unknown',
        sensor_type: 'telemetry',
        value: payload.ph,
        unit: 'pH',
        quality,
        nft_flow: payload.nft_flow ? 1 : 0,
        lighting_state: 'unknown',
        temp_control: 'unknown',
        is_retransmit: payload.is_retransmit ? 1 : 0,
      });

      this._syncTelemetryAlerts(payload, quality);
      this._registerTelemetryLog(payload, quality);

      return {
        accepted: true,
        quality,
        deviceId: payload.device_id,
      };
    },

    /* Valida campos minimos para evitar telemetria inconsistente. */
    _validateTelemetry(payload) {
      if (!payload.device_id) {
        throw new Error('Campo "device_id" e obrigatorio.');
      }

      if (payload.ph !== undefined && (payload.ph < 0 || payload.ph > 14)) {
        throw new Error(`Campo "ph" invalido: ${payload.ph}.`);
      }

      if (payload.temperature !== undefined && (payload.temperature < -10 || payload.temperature > 80)) {
        throw new Error(`Campo "temperature" invalido: ${payload.temperature}.`);
      }
    },

    /* Classifica qualidade da leitura com base nos limites de configuracao. */
    _assessQuality(payload) {
      const limits = config.SENSOR_LIMITS;

      if (
        payload.ph !== undefined
        && (payload.ph < limits.ph.min || payload.ph > limits.ph.max)
      ) {
        return 'warning';
      }

      if (payload.ec !== undefined && payload.ec < 0.05) {
        return 'invalid';
      }

      return 'ok';
    },

    /*
     * Atualiza alerta de pH fora de faixa para acompanhamento operacional.
     * O alerta e resolvido automaticamente quando o pH volta ao intervalo ideal.
     */
    _syncTelemetryAlerts(payload, quality) {
      if (payload.ph === undefined) return;

      if (quality === 'warning') {
        alertsRepo.upsert(
          'ph_out_of_range',
          'warning',
          'pH fora da faixa ideal',
          `Leitura recebida: ${payload.ph}. Verifique dosagem da bomba de pH.`
        );
        return;
      }

      alertsRepo.resolve('ph_out_of_range');
    },

    /* Escreve log resumido de telemetria para rastreabilidade. */
    _registerTelemetryLog(payload, quality) {
      const phText = payload.ph !== undefined ? payload.ph : 'n/a';
      logsRepo.insert(
        quality === 'ok' ? 'info' : 'warning',
        'Telemetria recebida',
        `device=${payload.device_id} ph=${phText} quality=${quality}`
      );
    },

    /* Exporta dados historicos para gerar CSV no controller. */
    getExportData() {
      return sensorsRepo.exportCsv(24);
    },
  };
}

module.exports = makeSensorsService;
