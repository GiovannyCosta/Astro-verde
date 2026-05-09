/**
 * @module apiConfig
 * @description Endpoints HTTP de infraestrutura e automacao.
 * @hardware esp32/esp8266
 * @mode real
 */

const ApiConfig = {
  baseUrl: 'http://localhost:3001/api',
  endpoints: {
    sensorsLatest: '/sensors/latest',
    sensorsCsv: '/sensors/export/csv',
    alerts: '/alerts',
    logs: '/logs',
    lighting: '/actuators/lighting',
    temperature: '/actuators/temperature',
    health: '/health',
    systemState: '/state',
    sensorPh: '/sensor/ph',
    controlPump: '/control/pump',
    mode: '/mode',
    setFluxo: '/manual-controls/fluxo',
    setLuz: '/manual-controls/luz',
  },
};
