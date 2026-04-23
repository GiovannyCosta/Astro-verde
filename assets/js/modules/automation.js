/*
 * modules/automation.js - Controles de automacao, notificacao e comandos manuais.
 *
 * Responsabilidades:
 * - configurar overrides (manual/auto)
 * - salvar preferencias de notificacao
 * - executar comandos rapidos pelo painel
 */

const Automation = {
  _isBound: false,

  state: {
    lightingMode: 'manual',
    pumpMode: 'manual',
    wppNumber: '',
    checkInterval: 15,
    cycleHours: 8,
    channels: { whatsapp: true, telegram: false },
    events: { led: true, tempBaixa: false, tempAlta: true, nft: true, ph: false },
  },

  /*
   * Inicializa eventos da aba de automacao.
   * O guard _isBound evita duplicar listeners a cada troca de aba.
   */
  init() {
    if (!this._isBound) {
      this._bindToggles();
      this._bindSlider();
      this._bindActions();
      this._isBound = true;
    }

    this._renderTimeline();
  },

  /* Conecta switches de override manual/automatico. */
  _bindToggles() {
    [
      { id: 'toggleLighting', key: 'lightingMode', label: 'Override Iluminacao' },
      { id: 'togglePump', key: 'pumpMode', label: 'Override Bomba' },
    ].forEach(({ id, key, label }) => {
      const element = document.getElementById(id);
      if (!element) return;

      element.addEventListener('click', () => {
        const isAuto = element.classList.toggle('is-auto');
        const mode = isAuto ? 'auto' : 'manual';

        element.querySelectorAll('.toggle-opt').forEach((option) => {
          option.classList.toggle('active-opt', option.dataset.side === mode);
        });

        this.state[key] = mode;
        Logger.add('info', label, `Modo alterado para: ${mode}`);
      });
    });
  },

  /* Conecta slider de ciclo de irrigacao. */
  _bindSlider() {
    const slider = document.getElementById('cycleSlider');
    if (!slider) return;

    slider.addEventListener('input', () => {
      const hours = parseInt(slider.value, 10);
      this.state.cycleHours = hours;

      const hoursLabel = document.getElementById('cycleHours');
      const onLabel = document.getElementById('cycleOn');
      if (hoursLabel) hoursLabel.textContent = `${hours}h`;
      if (onLabel) onLabel.textContent = `${hours}h`;

      this._renderTimeline();
    });
  },

  /* Renderiza barra visual do ciclo configurado no slider. */
  _renderTimeline() {
    const container = document.getElementById('cycleTimeline');
    if (!container) return;

    const hours = this.state.cycleHours;
    const widthPercent = ((hours / 24) * 100).toFixed(1);
    container.innerHTML = `<div class="cycle-bar" style="width:${widthPercent}%">${hours}h</div>`;

    const marks = [0, 4, 8, 12, 16, 20, 24];
    const ticks = document.getElementById('cycleTicks');
    if (ticks) ticks.innerHTML = marks.map((mark) => `<span>${mark}h</span>`).join('');

    const start = document.getElementById('cycleStart');
    if (start) start.textContent = '08:00';
  },

  /* Conecta botoes e checkboxes da area de automacao/notificacao. */
  _bindActions() {
    document.querySelector('[data-ui-action="save-wpp"]')?.addEventListener('click', () => {
      const number = (document.getElementById('wppNumber')?.value || '').trim();
      if (!number) {
        Modal.show('Aviso', 'Informe um numero de WhatsApp valido.', 'warning');
        return;
      }

      this.state.wppNumber = number;
      Modal.show('Salvo!', `Notificacoes WhatsApp serao enviadas para ${number}.`, 'success');
      Logger.add('info', 'WhatsApp', `Numero configurado: ${number}`);
      this._addNotifLog('ph-check-circle', `Numero ${number} salvo com sucesso.`);
    });

    document.querySelector('[data-ui-action="save-interval"]')?.addEventListener('click', () => {
      const value = parseInt(document.getElementById('checkInterval')?.value || '0', 10);
      if (!value || value < 1 || value > 1440) {
        Modal.show('Aviso', 'Informe um intervalo entre 1 e 1440 minutos.', 'warning');
        return;
      }

      this.state.checkInterval = value;
      Modal.show('Configurado!', `Sistema verificara alertas a cada ${value} minuto(s).`, 'success');
      Logger.add('info', 'Timer', `Intervalo de verificacao definido: ${value} min`);
    });

    const commands = {
      'cmd-pump-on': ['ph-drop-half', 'Bomba Ligada', 'Bomba de irrigacao ativada manualmente via painel.'],
      'cmd-pump-off': ['ph-drop-slash', 'Bomba Desligada', 'Bomba de irrigacao desativada manualmente via painel.'],
      'cmd-light-on': ['ph-sun', 'LED Ligado', 'Iluminacao LED ativada manualmente via painel.'],
      'cmd-light-off': ['ph-moon', 'LED Desligado', 'Iluminacao LED desativada manualmente via painel.'],
    };

    Object.entries(commands).forEach(([action, [icon, title, message]]) => {
      document.querySelector(`[data-ui-action="${action}"]`)?.addEventListener('click', async () => {
        if (AppState.dataSource === 'api') {
          await this._trySendHardwareCommand(action);
        }

        Modal.show(title, message, 'success');
        Logger.add('info', title, message);
        this._addNotifLog(icon, message);
      });
    });

    document.querySelector('[data-ui-action="send-test-notif"]')?.addEventListener('click', () => {
      const channels = [];
      if (this.state.channels.whatsapp) channels.push('WhatsApp');
      if (this.state.channels.telegram) channels.push('Telegram');

      const destination = channels.length ? channels.join(' e ') : 'nenhum canal configurado';
      const message = `Notificacao de teste enviada via ${destination}. Sistema operando normalmente.`;
      Modal.show('Teste Enviado', message, 'info');
      Logger.add('info', 'Notificacao de Teste', message);
      this._addNotifLog('ph-paper-plane-tilt', `Teste: ${destination}`);
    });

    const whatsappCheckbox = document.getElementById('chWpp');
    const telegramCheckbox = document.getElementById('chTelegram');
    whatsappCheckbox?.addEventListener('change', () => { this.state.channels.whatsapp = whatsappCheckbox.checked; });
    telegramCheckbox?.addEventListener('change', () => { this.state.channels.telegram = telegramCheckbox.checked; });

    const eventMap = {
      evtLed: 'led',
      evtTempBaixa: 'tempBaixa',
      evtTempAlta: 'tempAlta',
      evtNft: 'nft',
      evtPh: 'ph',
    };

    Object.entries(eventMap).forEach(([elementId, key]) => {
      document.getElementById(elementId)?.addEventListener('change', (event) => {
        this.state.events[key] = event.target.checked;
      });
    });
  },

  /*
   * Quando em modo API, envia comandos para endpoints novos da camada fisica.
   * Isso deixa o frontend preparado para ESP32 sem mudar interface.
   */
  async _trySendHardwareCommand(action) {
    try {
      if (action === 'cmd-pump-on') await ApiService.setPumpState(true);
      if (action === 'cmd-pump-off') await ApiService.setPumpState(false);
      if (action === 'cmd-light-on') await ApiService.setLighting('on', 100);
      if (action === 'cmd-light-off') await ApiService.setLighting('off', 0);
      await ApiService.syncState();
    } catch (error) {
      Logger.add('warning', 'Comando API', `Falha ao enviar comando para backend: ${error.message}`);
    }
  },

  /* Registra historico visual de notificacoes na aba de automacao. */
  _addNotifLog(icon, message) {
    const container = document.getElementById('notifLog');
    if (!container) return;

    const empty = container.querySelector('.notif-log-empty');
    if (empty) empty.remove();

    const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const entry = document.createElement('div');
    entry.className = 'notif-log-entry';
    entry.innerHTML = `
      <i class="ph ${icon}"></i>
      <span class="log-msg">${message}</span>
      <span class="log-time">${time}</span>
    `;

    container.prepend(entry);
  },
};
