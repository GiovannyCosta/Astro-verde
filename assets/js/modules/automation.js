/*
 * modules/automation.js — Automação, Alertas e Controle via Celular
 */

const Automation = {

  state: {
    lightingMode: 'manual',
    pumpMode: 'manual',
    wppNumber: '',
    checkInterval: 15,
    cycleHours: 8,
    channels: { whatsapp: true, telegram: false },
    events: { led: true, tempBaixa: false, tempAlta: true, nft: true, ph: false },
  },

  init() {
    this._bindToggles();
    this._bindSlider();
    this._renderTimeline();
    this._bindActions();
  },

  _bindToggles() {
    [
      { id: 'toggleLighting', key: 'lightingMode', label: 'Override Iluminação' },
      { id: 'togglePump',     key: 'pumpMode',     label: 'Override Bomba'      },
    ].forEach(({ id, key, label }) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('click', () => {
        const isAuto = el.classList.toggle('is-auto');
        const mode = isAuto ? 'auto' : 'manual';
        el.querySelectorAll('.toggle-opt').forEach(opt => {
          opt.classList.toggle('active-opt', opt.dataset.side === mode);
        });
        this.state[key] = mode;
        Logger.add('info', label, `Modo alterado para: ${mode}`);
      });
    });
  },

  _bindSlider() {
    const slider = document.getElementById('cycleSlider');
    if (!slider) return;
    slider.addEventListener('input', () => {
      const h = parseInt(slider.value, 10);
      this.state.cycleHours = h;
      const hoursEl = document.getElementById('cycleHours');
      const onEl    = document.getElementById('cycleOn');
      if (hoursEl) hoursEl.textContent = `${h}h`;
      if (onEl)    onEl.textContent    = `${h}h`;
      this._renderTimeline();
    });
  },

  _renderTimeline() {
    const container = document.getElementById('cycleTimeline');
    if (!container) return;
    const h   = this.state.cycleHours;
    const pct = ((h / 24) * 100).toFixed(1);
    const startHour = 8;
    container.innerHTML = `<div class="cycle-bar" style="width:${pct}%">${h}h</div>`;

    const ticksEl = document.getElementById('cycleTicks');
    if (ticksEl) {
      const marks = [0, 4, 8, 12, 16, 20, 24];
      ticksEl.innerHTML = marks.map(m => `<span>${m}h</span>`).join('');
    }

    const startEl = document.getElementById('cycleStart');
    if (startEl) startEl.textContent = `${String(startHour).padStart(2,'0')}:00`;
  },

  _bindActions() {
    // Salvar número WhatsApp
    document.querySelector('[data-ui-action="save-wpp"]')
      ?.addEventListener('click', () => {
        const num = (document.getElementById('wppNumber')?.value || '').trim();
        if (!num) { Modal.show('Aviso', 'Informe um número de WhatsApp válido.', 'warning'); return; }
        this.state.wppNumber = num;
        Modal.show('Salvo!', `Notificações WhatsApp serão enviadas para ${num}.`, 'success');
        Logger.add('info', 'WhatsApp', `Número configurado: ${num}`);
        this._addNotifLog('ph-check-circle', `Número ${num} salvo com sucesso.`);
      });

    // Salvar intervalo de verificação
    document.querySelector('[data-ui-action="save-interval"]')
      ?.addEventListener('click', () => {
        const val = parseInt(document.getElementById('checkInterval')?.value || '0', 10);
        if (!val || val < 1 || val > 1440) {
          Modal.show('Aviso', 'Informe um intervalo entre 1 e 1440 minutos.', 'warning');
          return;
        }
        this.state.checkInterval = val;
        Modal.show('Configurado!', `Sistema verificará alertas a cada ${val} minuto(s).`, 'success');
        Logger.add('info', 'Timer', `Intervalo de verificação definido: ${val} min`);
      });

    // Comandos rápidos via celular
    const cmds = {
      'cmd-pump-on':  ['ph-drop-half',      'Bomba Ligada',     'Bomba de irrigação ativada manualmente via painel.'],
      'cmd-pump-off': ['ph-drop-slash',      'Bomba Desligada',  'Bomba de irrigação desativada manualmente via painel.'],
      'cmd-light-on': ['ph-sun',             'LED Ligado',       'Iluminação LED ativada manualmente via painel.'],
      'cmd-light-off':['ph-moon',            'LED Desligado',    'Iluminação LED desativada manualmente via painel.'],
    };

    Object.entries(cmds).forEach(([action, [icon, title, msg]]) => {
      document.querySelector(`[data-ui-action="${action}"]`)
        ?.addEventListener('click', () => {
          Modal.show(title, msg, 'success');
          Logger.add('info', title, msg);
          this._addNotifLog(icon, msg);
        });
    });

    // Enviar notificação de teste
    document.querySelector('[data-ui-action="send-test-notif"]')
      ?.addEventListener('click', () => {
        const channels = [];
        if (this.state.channels.whatsapp) channels.push('WhatsApp');
        if (this.state.channels.telegram) channels.push('Telegram');
        const dest = channels.length ? channels.join(' e ') : 'nenhum canal configurado';
        const msg  = `Notificação de teste enviada via ${dest}. Sistema operando normalmente.`;
        Modal.show('Teste Enviado', msg, 'info');
        Logger.add('info', 'Notificação de Teste', msg);
        this._addNotifLog('ph-paper-plane-tilt', `Teste: ${dest}`);
      });

    // Checkboxes de canal
    const chWpp      = document.getElementById('chWpp');
    const chTelegram = document.getElementById('chTelegram');
    chWpp?.addEventListener('change',      () => { this.state.channels.whatsapp  = chWpp.checked; });
    chTelegram?.addEventListener('change', () => { this.state.channels.telegram  = chTelegram.checked; });

    // Checkboxes de eventos
    const evtMap = {
      evtLed:      'led',
      evtTempBaixa:'tempBaixa',
      evtTempAlta: 'tempAlta',
      evtNft:      'nft',
      evtPh:       'ph',
    };
    Object.entries(evtMap).forEach(([id, key]) => {
      document.getElementById(id)?.addEventListener('change', e => {
        this.state.events[key] = e.target.checked;
      });
    });
  },

  _addNotifLog(icon, msg) {
    const container = document.getElementById('notifLog');
    if (!container) return;
    const empty = container.querySelector('.notif-log-empty');
    if (empty) empty.remove();
    const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const entry = document.createElement('div');
    entry.className = 'notif-log-entry';
    entry.innerHTML = `
      <i class="ph ${icon}"></i>
      <span class="log-msg">${msg}</span>
      <span class="log-time">${time}</span>
    `;
    container.prepend(entry);
  },
};
