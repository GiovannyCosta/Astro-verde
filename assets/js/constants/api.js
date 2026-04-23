/*
 * constants/api.js - Enderecos e rotas da API do Astro Verde.
 *
 * Centralizar endpoints aqui facilita:
 * - trocar host/porta
 * - atualizar versoes da API
 * - integrar ambiente local x producao
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
  },
};
