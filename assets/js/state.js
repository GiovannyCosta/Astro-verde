/**
 * @module state
 * @description Estado global incluindo sensores real/simulated/editable e metadados de origem.
 * @hardware esp32/esp8266
 * @mode real
 */

const AppState = {
  sensors: {
    ph: 6.1,
    ec: 1.75,
    tds: 875,
    temperature: 23.0,
    humidity: 65,
    luminosity: 800,
    waterLevel: 88,
    nftFlow: true,
    boia: true,
    nivel_reservatorio: 88,
    fluxo_laminar: 0,
    iluminacao: { modo: 'manual', on: true, intensidade: 100 },
  },

  sensorMeta: {
    ph: { mode: 'real', lastReadingAt: null },
    boia: { mode: 'real', lastReadingAt: null },
    nivel_reservatorio: { mode: 'real', lastReadingAt: null },
    ec: { mode: 'simulated', lastReadingAt: null },
    temperature: { mode: 'simulated', lastReadingAt: null },
    fluxo_laminar: { mode: 'editable', lastReadingAt: null },
    iluminacao: { mode: 'editable', lastReadingAt: null },
  },

  actuators: {
    lightingCommand: 'on',
    lightingState: 'acesa',
    lightingPower: 100,
    coolingActive: false,
    heatingActive: false,
  },

  system: {
    phAtual: 6.1,
    bombaLigada: false,
    modoAtual: 'simulado',
    ultimaAtualizacao: null,
    origemLeitura: 'simulada',
  },

  config: {
    ph: { min: 5.5, max: 6.5 },
    ec: { min: 1.2, max: 2.5 },
    temperature: { min: 18, max: 26, critical: 30 },
    luminosity: { minExpected: 200 },
    lightCycleHours: { on: 16, off: 8 },
  },

  alerts: [],
  logs: [],
  liveLogsFilter: 'all',

  modules: [
    { id: 'torreA', name: 'Torre A - 3 Modulos Empilhados', active: true },
    { id: 'torreB', name: 'Torre B - 2 Modulos Empilhados', active: true },
    { id: 'bombaPh', name: 'Bomba Dosadora de pH', active: true },
    { id: 'bombaNutrientes', name: 'Bomba dos Nutrientes', active: false },
    { id: 'iluminacao', name: 'Sistema de Iluminacao LED', active: true },
  ],

  dataSource: 'api',
  unreadNotifications: 1,
};
