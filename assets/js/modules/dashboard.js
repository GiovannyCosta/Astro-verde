/*
 * modules/dashboard.js — Atualização do Dashboard Principal
 *
 * Responsável por ler o AppState e atualizar todos os
 * elementos visuais do dashboard: KPIs, estado dos atuadores,
 * alertas e gráfico histórico.
 *
 * Não manipula dados — apenas lê e renderiza.
 * Quem decide o que atualizar é o AppState.
 * Quem avalia as regras é o BusinessRules.
 * Quem atualiza o gráfico é o Charts.
 */

const Dashboard = {

  /* ============================================================
     REFRESH — ponto de entrada principal
     Chamado pelo simulador a cada tick.
     ============================================================ */
  refresh() {
    this._updatePh();
    this._updateEc();
    this._updateTemperature();
    this._updateNft();
    this._updateLighting();
    this._updateWaterLevel();
    this._updateActuatorIndicators();

    // Atualiza alertas no banner
    Alerts.render();

    // Atualiza o gráfico com novos pontos
    Charts.addDataPoint(
      AppState.sensors.temperature,
      AppState.sensors.humidity
    );
  },

  /* ============================================================
     CARD DE pH
     Muda a cor e o texto de status conforme a faixa.
     ============================================================ */
  _updatePh() {
    const el     = document.getElementById('phValue');
    const status = document.getElementById('phStatus');
    const card   = document.getElementById('cardPh');
    if (!el) return;

    const ph  = AppState.sensors.ph;
    const cfg = AppState.config.ph;

    el.textContent = ph.toFixed(1);

    if (ph < cfg.min || ph > cfg.max) {
      status.textContent = `Fora do Ideal (${cfg.min}–${cfg.max})`;
      status.className   = 'status-text status-danger';
      card.classList.add('danger');
      card.classList.remove('warning');
    } else if (ph < cfg.min + 0.3 || ph > cfg.max - 0.3) {
      // Próximo do limite — atenção
      status.textContent = `Atenção (${cfg.min}–${cfg.max})`;
      status.className   = 'status-text status-alert';
      card.classList.add('warning');
      card.classList.remove('danger');
    } else {
      status.textContent = `Ideal (${cfg.min}–${cfg.max})`;
      status.className   = 'status-text status-ok';
      card.classList.remove('danger', 'warning');
    }
  },

  /* ============================================================
     CARD DE EC/TDS
     ============================================================ */
  _updateEc() {
    const ecEl  = document.getElementById('ecValue');
    const tdsEl = document.getElementById('tdsValue');
    if (!ecEl) return;

    ecEl.textContent  = AppState.sensors.ec.toFixed(2);
    if (tdsEl) tdsEl.textContent = AppState.sensors.tds;
  },

  /* ============================================================
     CARD DE TEMPERATURA
     ============================================================ */
  _updateTemperature() {
    const el     = document.getElementById('tempValue');
    const status = document.getElementById('tempStatus');
    const card   = document.getElementById('cardTemp');
    if (!el) return;

    const temp = AppState.sensors.temperature;
    const cfg  = AppState.config.temperature;

    el.textContent = `${temp.toFixed(1)}°C`;

    if (temp > cfg.critical) {
      status.textContent = 'Temperatura Crítica — Proteção Ativa';
      status.className = 'status-text status-danger';
      card.classList.add('danger');
      card.classList.remove('warning');
    } else if (temp > cfg.max) {
      status.textContent = `Elevada — Resfriamento Ativo`;
      status.className = 'status-text status-alert';
      card.classList.add('warning');
      card.classList.remove('danger');
    } else if (temp < cfg.min) {
      status.textContent = `Baixa — Aquecimento Ativo`;
      status.className = 'status-text status-alert';
      card.classList.add('warning');
      card.classList.remove('danger');
    } else {
      status.textContent = `Ideal (${cfg.min}–${cfg.max}°C)`;
      status.className = 'status-text status-ok';
      card.classList.remove('danger', 'warning');
    }
  },

  /* ============================================================
     CARD DO FLUXO NFT
     ============================================================ */
  _updateNft() {
    const valEl  = document.getElementById('nftStatusVal');
    const subEl  = document.getElementById('nftStatusSub');
    if (!valEl) return;

    if (AppState.sensors.nftFlow) {
      valEl.textContent = 'Circulando';
      valEl.style.color = '';
      if (subEl) subEl.innerHTML = 'Bomba Principal: <span class="status-ok">Ligada</span>';
    } else {
      valEl.textContent = 'INTERROMPIDO';
      valEl.style.color = 'var(--primary-pink)';
      if (subEl) subEl.innerHTML = 'Bomba Principal: <span class="status-danger">Falha Crítica</span>';
    }
  },

  /* ============================================================
     CARD DE ILUMINAÇÃO
     Exibe o estado: acesa / apagada / queimada
     ============================================================ */
  _updateLighting() {
    const stateEl = document.getElementById('lightingState');
    const subEl   = document.getElementById('lightingSub');
    const card    = document.getElementById('cardLighting');
    if (!stateEl) return;

    const state = AppState.actuators.lightingState;
    const power = AppState.actuators.lightingPower;

    const labels = {
      acesa:   { text: '💡 Acesa',   cls: 'on',     cardCls: ''       },
      apagada: { text: '🌙 Apagada', cls: 'off',    cardCls: ''       },
      queimada:{ text: '⚠️ Queimada',cls: 'burned', cardCls: 'danger' },
    };

    const { text, cls, cardCls } = labels[state] || labels.apagada;

    stateEl.innerHTML = `<span class="light-state ${cls}">${text}</span>`;
    if (subEl) subEl.textContent = `Potência: ${power}% | Ciclo: 16h/8h`;

    if (card) {
      card.classList.remove('danger', 'warning');
      if (cardCls) card.classList.add(cardCls);
    }
  },

  /* ============================================================
     CARD DO RESERVATÓRIO
     ============================================================ */
  _updateWaterLevel() {
    const el = document.getElementById('waterLevel');
    if (!el) return;
    el.textContent = AppState.sensors.waterLevel.toFixed(1) + '%';
  },

  /* ============================================================
     INDICADORES DOS ATUADORES DE TEMPERATURA
     ============================================================ */
  _updateActuatorIndicators() {
    const coolingEl = document.getElementById('coolingStatus');
    const heatingEl = document.getElementById('heatingStatus');

    if (coolingEl) {
      coolingEl.textContent = AppState.actuators.coolingActive ? 'Ativo' : 'Inativo';
      coolingEl.className   = AppState.actuators.coolingActive ? 'status-text status-ok' : 'status-text status-danger';
    }

    if (heatingEl) {
      heatingEl.textContent = AppState.actuators.heatingActive ? 'Ativo' : 'Inativo';
      heatingEl.className   = AppState.actuators.heatingActive ? 'status-text status-ok' : 'status-text status-danger';
    }
  },
};
