/*
 * modules/logs.js — Log Operacional e Status de Módulos
 */

const Logger = {

  MAX_ENTRIES: 200,

  add(type, title, message) {
    AppState.logs.unshift({
      type, title, message,
      timestamp: new Date().toLocaleString('pt-BR'),
    });
    if (AppState.logs.length > this.MAX_ENTRIES) AppState.logs.pop();

    // Se a aba de log estiver ativa, atualiza em tempo real
    const logSection = document.getElementById('log');
    if (logSection && logSection.classList.contains('active')) {
      this._renderLogEntries();
    }
  },

  render() {
    this._renderModuleStatus();
    this._renderLogEntries();
  },

  _renderModuleStatus() {
    const container = document.getElementById('moduleStatus');
    if (!container) return;

    container.innerHTML = '';
    AppState.modules.forEach(m => {
      const div = document.createElement('div');
      div.className = 'list-item';
      div.innerHTML = `
        <div class="item-info">
          <h4>${m.name}</h4>
          <p>Status: <span class="${m.active ? 'status-ok' : 'status-danger'}">${m.active ? 'Ativo' : 'Inativo'}</span></p>
        </div>
        <span class="badge-status ${m.active ? 'active' : 'inactive'}">${m.active ? 'Online' : 'Offline'}</span>
      `;
      container.appendChild(div);
    });
  },

  _renderLogEntries() {
    const container = document.getElementById('logsContainer');
    if (!container) return;

    const countEl = document.getElementById('logCount');
    if (countEl) countEl.textContent = `${AppState.logs.length} entrada(s)`;

    container.innerHTML = '';

    if (AppState.logs.length === 0) {
      container.innerHTML = '<div class="list-item"><div class="item-info"><p>Nenhum evento registrado.</p></div></div>';
      return;
    }

    AppState.logs.forEach(log => {
      const div = document.createElement('div');
      div.className = 'list-item';
      div.innerHTML = `
        <div class="item-info">
          <h4>
            <span class="log-type-badge ${log.type}">${log.type.toUpperCase()}</span>
            &nbsp;${log.title}
          </h4>
          <p>${log.message}</p>
        </div>
        <span class="log-timestamp">${log.timestamp}</span>
      `;
      container.appendChild(div);
    });
  },
};
