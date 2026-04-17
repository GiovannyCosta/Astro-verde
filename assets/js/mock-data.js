/*
 * mock-data.js — Simulador de Sensores IoT
 *
 * Este arquivo simula o comportamento de sensores físicos
 * enquanto o hardware real (ESP32/Arduino) não está conectado.
 *
 * Como funciona:
 * 1. A cada intervalo (setInterval), os valores de pH, EC,
 *    temperatura etc. variam ligeiramente (ruído aleatório).
 * 2. As regras de negócio (faixas ideais) são verificadas.
 * 3. O estado da aplicação (AppState) é atualizado.
 * 4. Os módulos de UI são notificados para redesenhar.
 *
 * No futuro, quando o ESP32 estiver conectado, basta
 * desativar este simulador e ligar o módulo api.js.
 * O frontend não precisa mudar — ele sempre lê o AppState.
 */

const MockSimulator = {

  /* Intervalo de atualização em ms — simula frequência do sensor */
  INTERVAL_MS: 3000,

  /* Referência ao timer para poder pausar a simulação */
  _timer: null,

  /* ============================================================
     INICIALIZAÇÃO
     Chama start() uma vez no carregamento da página.
     ============================================================ */
  start() {
    console.log('[Mock] Simulador de sensores iniciado');
    this._tick(); // executa imediatamente na primeira vez
    this._timer = setInterval(() => this._tick(), this.INTERVAL_MS);
  },

  stop() {
    clearInterval(this._timer);
    console.log('[Mock] Simulador pausado');
  },

  /* ============================================================
     TICK — ciclo de atualização dos sensores
     Chamado a cada INTERVAL_MS milissegundos.
     ============================================================ */
  _tick() {
    // Só atualiza sensores se o fluxo NFT estiver ativo
    if (!AppState.sensors.nftFlow) return;

    this._updatePh();
    this._updateEc();
    this._updateTemperature();
    this._updateHumidity();
    this._updateLuminosity();
    this._updateWaterLevel();
    this._updateLightingState();

    // Aplica as regras de negócio e gera alertas se necessário
    BusinessRules.evaluate();

    // Notifica os módulos de UI para atualizar a tela
    Dashboard.refresh();
  },

  /* ============================================================
     SIMULAÇÃO DE pH
     Oscila em torno do valor atual com variação de ±0.1.
     Limite físico: 5.0 a 7.0 para solução nutritiva.
     ============================================================ */
  _updatePh() {
    const variation = (Math.random() - 0.5) * 0.1;
    AppState.sensors.ph = Math.min(7.0, Math.max(5.0,
      AppState.sensors.ph + variation
    ));
  },

  /* ============================================================
     SIMULAÇÃO DE EC/TDS
     EC e TDS são correlacionados: TDS ≈ EC × 500.
     ============================================================ */
  _updateEc() {
    const variation = (Math.random() - 0.5) * 0.05;
    AppState.sensors.ec = Math.min(3.0, Math.max(0.5,
      AppState.sensors.ec + variation
    ));
    // TDS é derivado do EC — sem necessidade de sensor separado
    AppState.sensors.tds = Math.round(AppState.sensors.ec * 500);
  },

  /* ============================================================
     SIMULAÇÃO DE TEMPERATURA
     Varia mais durante o dia (quando LED está ligado).
     ============================================================ */
  _updateTemperature() {
    // Se a luz estiver ligada, aquece ligeiramente mais
    const heatBias = AppState.actuators.lightingState === 'acesa' ? 0.05 : -0.05;
    const variation = (Math.random() - 0.5) * 0.3 + heatBias;
    AppState.sensors.temperature = Math.min(35, Math.max(15,
      AppState.sensors.temperature + variation
    ));
  },

  /* ============================================================
     SIMULAÇÃO DE UMIDADE
     Inversa da temperatura — quando esquenta, tende a secar.
     ============================================================ */
  _updateHumidity() {
    const variation = (Math.random() - 0.5) * 1.5;
    AppState.sensors.humidity = Math.min(95, Math.max(40,
      AppState.sensors.humidity + variation
    ));
  },

  /* ============================================================
     SIMULAÇÃO DE LUMINOSIDADE
     Se o comando for 'on', luminosidade fica alta.
     Se for 'off', cai para quase zero (luz ambiente mínima).
     ============================================================ */
  _updateLuminosity() {
    if (AppState.actuators.lightingCommand === 'on') {
      // Varia em torno de 800 lux com ruído
      AppState.sensors.luminosity = Math.max(200,
        800 + (Math.random() - 0.5) * 100
      );
    } else {
      // Apagada — apenas luz ambiente residual
      AppState.sensors.luminosity = Math.round(Math.random() * 30);
    }
  },

  /* ============================================================
     SIMULAÇÃO DO NÍVEL DO RESERVATÓRIO
     Diminui lentamente com o tempo (evapotranspiração).
     ============================================================ */
  _updateWaterLevel() {
    // 20% de chance de diminuir 0.1% a cada tick
    if (Math.random() > 0.8 && AppState.sensors.waterLevel > 70) {
      AppState.sensors.waterLevel = parseFloat(
        (AppState.sensors.waterLevel - 0.1).toFixed(1)
      );
    }
  },

  /* ============================================================
     DERIVAR ESTADO DA ILUMINAÇÃO
     A partir do comando e da luminosidade medida,
     calcula o estado real (acesa/apagada/queimada).

     Regra de negócio:
     - comando=on  + lux >= min  → 'acesa'
     - comando=off              → 'apagada'
     - comando=on  + lux <  min → 'queimada'
     ============================================================ */
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

  /* ============================================================
     AÇÕES MANUAIS (chamadas pelos botões da UI)
     ============================================================ */

  /* Corrige o pH para o valor ideal (aciona bomba dosadora) */
  correctPh() {
    AppState.sensors.ph = 6.0;
    Logger.add('success', 'Ajuste de pH',
      'Bomba dosadora acionada. pH estabilizado em 6.0.');
  },

  /* Simula falha no fluxo NFT */
  simulateNftFailure() {
    AppState.sensors.nftFlow = false;
    Logger.add('critical', 'Falha NFT',
      'Interrupção detectada no fluxo laminar de nutrientes.');

    // Restaura automaticamente após 10 segundos (para poder testar de novo)
    setTimeout(() => {
      AppState.sensors.nftFlow = true;
      Logger.add('success', 'Recuperação NFT',
        'Fluxo laminar restaurado. Bomba principal ligada.');
      Dashboard.refresh();
    }, 10000);
  },

  /* Simula falha de iluminação (lâmpada queimada) */
  simulateLightBurn() {
    AppState.actuators.lightingCommand = 'on';   // comando diz para ligar
    AppState.sensors.luminosity = 0;             // mas sensor não detecta luz
    AppState.actuators.lightingState = 'queimada';
    Logger.add('critical', 'Iluminação Queimada',
      'Comando de ligar enviado mas luminosidade não detectada.');
    Dashboard.refresh();
  },
};
