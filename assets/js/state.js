/*
 * state.js - Estado global da interface Astro Verde.
 *
 * Este arquivo separa claramente:
 * - leituras de sensores para UI
 * - estado dos atuadores
 * - estado central do sistema (modo, pH, bomba, origem)
 * - configuracoes de regra e metadados de interface
 *
 * Como todos os modulos leem este objeto, fica simples evoluir sem
 * espalhar variaveis globais desconectadas.
 */

const AppState = {
  /* Leitura exibida no dashboard principal. */
  sensors: {
    ph: 6.1,
    ec: 1.75,
    tds: 875,
    temperature: 23.0,
    humidity: 65,
    luminosity: 800,
    waterLevel: 88,
    nftFlow: true,
  },

  /* Estado visual dos atuadores exibido em cards e paines. */
  actuators: {
    lightingCommand: 'on',
    lightingState: 'acesa',
    lightingPower: 100,
    coolingActive: false,
    heatingActive: false,
  },

  /*
   * Estado central de integracao fisica.
   * Esses campos espelham a API /api/state para facilitar transicao para ESP32.
   */
  system: {
    phAtual: 6.1,
    bombaLigada: false,
    modoAtual: 'simulado',
    ultimaAtualizacao: null,
    origemLeitura: 'simulada',
  },

  /* Limites de negocio usados pelas regras e badges visuais. */
  config: {
    ph: { min: 5.5, max: 6.5 },
    ec: { min: 1.2, max: 2.5 },
    temperature: { min: 18, max: 26, critical: 30 },
    luminosity: { minExpected: 200 },
    lightCycleHours: { on: 16, off: 8 },
  },

  /* Alertas ativos renderizados no banner superior. */
  alerts: [],

  /* Log exibido na aba de eventos. */
  logs: [],

  /* Status dos modulos/dispositivos exibidos na aba de log. */
  modules: [
    { id: 'torreA', name: 'Torre A - 3 Modulos Empilhados', active: true },
    { id: 'torreB', name: 'Torre B - 2 Modulos Empilhados', active: true },
    { id: 'bombaPh', name: 'Bomba Dosadora de pH', active: true },
    { id: 'bombaNutrientes', name: 'Bomba dos Nutrientes', active: false },
    { id: 'iluminacao', name: 'Sistema de Iluminacao LED', active: true },
  ],

  /*
   * Fonte atual de dados da aplicacao:
   * - "mock": usa simulador local em JavaScript
   * - "api": consome backend Node.js
   */
  dataSource: 'mock',

  /* Contador de notificacoes nao lidas exibido na topbar. */
  unreadNotifications: 1,
};
