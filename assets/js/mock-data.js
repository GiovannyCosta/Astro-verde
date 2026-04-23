/*
 * mock-data.js - Simulador local de sensores para testes sem hardware.
 *
 * Este modulo permite validar tela e regras de negocio sem ESP32:
 * - gera oscilacao de sensores
 * - aplica regras de alerta
 * - atualiza o dashboard periodicamente
 */

const MockSimulator = {
  INTERVAL_MS: 3000,
  _timer: null,

  /* Inicia simulacao local com um tick imediato. */
  start() {
    if (this._timer) return;
    console.log('[Mock] Simulador de sensores iniciado.');
    this._tick();
    this._timer = setInterval(() => this._tick(), this.INTERVAL_MS);
  },

  /* Para simulacao local para evitar intervalos duplicados. */
  stop() {
    if (!this._timer) return;
    clearInterval(this._timer);
    this._timer = null;
    console.log('[Mock] Simulador pausado.');
  },

  /* Executa ciclo completo de atualizacao dos sensores simulados. */
  _tick() {
    if (!AppState.sensors.nftFlow) return;

    this._updatePh();
    this._updateEc();
    this._updateTemperature();
    this._updateHumidity();
    this._updateLuminosity();
    this._updateWaterLevel();
    this._updateLightingState();
    this._syncSystemState();

    BusinessRules.evaluate();
    Dashboard.refresh();
  },

  /* Simula variacao de pH em faixa realista para cultivo hidropônico. */
  _updatePh() {
    const variation = (Math.random() - 0.5) * 0.1;
    AppState.sensors.ph = Math.min(7.0, Math.max(5.0, AppState.sensors.ph + variation));
  },

  /* Simula EC e recalcula TDS para manter coerencia entre indicadores. */
  _updateEc() {
    const variation = (Math.random() - 0.5) * 0.05;
    AppState.sensors.ec = Math.min(3.0, Math.max(0.5, AppState.sensors.ec + variation));
    AppState.sensors.tds = Math.round(AppState.sensors.ec * 500);
  },

  /* Simula temperatura com leve influencia do estado de iluminacao. */
  _updateTemperature() {
    const heatBias = AppState.actuators.lightingState === 'acesa' ? 0.05 : -0.05;
    const variation = (Math.random() - 0.5) * 0.3 + heatBias;
    AppState.sensors.temperature = Math.min(35, Math.max(15, AppState.sensors.temperature + variation));
  },

  /* Simula umidade com variacao gradual para visualizacao em grafico. */
  _updateHumidity() {
    const variation = (Math.random() - 0.5) * 1.5;
    AppState.sensors.humidity = Math.min(95, Math.max(40, AppState.sensors.humidity + variation));
  },

  /* Simula luminosidade conforme comando da iluminacao. */
  _updateLuminosity() {
    if (AppState.actuators.lightingCommand === 'on') {
      AppState.sensors.luminosity = Math.max(200, 800 + (Math.random() - 0.5) * 100);
      return;
    }

    AppState.sensors.luminosity = Math.round(Math.random() * 30);
  },

  /* Reduz nivel do reservatorio lentamente para simular consumo da cultura. */
  _updateWaterLevel() {
    if (Math.random() > 0.8 && AppState.sensors.waterLevel > 70) {
      AppState.sensors.waterLevel = Number((AppState.sensors.waterLevel - 0.1).toFixed(1));
    }
  },

  /* Deriva estado real da iluminacao a partir de comando + lux medido. */
  _updateLightingState() {
    const cmd = AppState.actuators.lightingCommand;
    const lux = AppState.sensors.luminosity;
    const minLux = AppState.config.luminosity.minExpected;

    if (cmd === 'off') {
      AppState.actuators.lightingState = 'apagada';
    } else if (lux >= minLux) {
      AppState.actuators.lightingState = 'acesa';
    } else {
      AppState.actuators.lightingState = 'queimada';
    }
  },

  /*
   * Mantem AppState.system alinhado ao simulador.
   * Isso deixa a interface pronta para trocar para backend real sem quebrar fluxo.
   */
  _syncSystemState() {
    AppState.system.phAtual = Number(AppState.sensors.ph.toFixed(2));
    AppState.system.bombaLigada = AppState.system.phAtual > 7;
    AppState.system.modoAtual = 'simulado';
    AppState.system.origemLeitura = 'simulada';
    AppState.system.ultimaAtualizacao = new Date().toISOString();
  },

  /* Acao manual para corrigir pH via botao da interface. */
  correctPh() {
    AppState.sensors.ph = 6.0;
    this._syncSystemState();
    Logger.add('success', 'Ajuste de pH', 'Bomba dosadora acionada. pH estabilizado em 6.0.');
  },

  /* Acao manual para simular falha no fluxo NFT. */
  simulateNftFailure() {
    AppState.sensors.nftFlow = false;
    Logger.add('critical', 'Falha NFT', 'Interrupcao detectada no fluxo laminar de nutrientes.');

    setTimeout(() => {
      AppState.sensors.nftFlow = true;
      Logger.add('success', 'Recuperacao NFT', 'Fluxo laminar restaurado. Bomba principal ligada.');
      Dashboard.refresh();
    }, 10000);
  },

  /* Acao manual para simular lampada queimada. */
  simulateLightBurn() {
    AppState.actuators.lightingCommand = 'on';
    AppState.sensors.luminosity = 0;
    AppState.actuators.lightingState = 'queimada';
    Logger.add('critical', 'Iluminacao Queimada', 'Comando de ligar enviado mas luminosidade nao detectada.');
    Dashboard.refresh();
  },
};
