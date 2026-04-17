/*
 * modules/logs.js — Sistema de Log Operacional
 *
 * Registra e exibe eventos do sistema: ajustes manuais,
 * falhas, recuperações, exportações e mudanças de estado.
 *
 * O log é um histórico auditável — não deve ser apagado
 * automaticamente. Mantemos os últimos 200 eventos em memória.
 *
 * No backend, esses logs são persistidos no banco de dados
 * (tabela `system_logs`) para consulta futura.
 */

const Logger = {

  MAX_ENTRIES: 200,

  /* ============================================================
     ADICIONAR ENTRADA DE LOG
     type: 'info' | 'success' | 'warning' | 'critical'
     ============================================================ */
  add(type, title, message) {
    const entry = {
      type,
      title,
      message,
      timestamp: new Date().toLocaleString('pt-BR'),
    };

    // Insere no início — log mais recente aparece primeiro
    AppState.logs.unshift(entry);

    // Mantém limite máximo de entradas
    if (AppState.logs.length > this.MAX_ENTRIES) {
      AppState.logs.pop();
    }
  },

  /* ============================================================
     RENDERIZAR LOG NA TELA
     Chamado quando a aba "Log" está ativa ou quando
     há nova entrada.
     ============================================================ */
  render() {
    this._renderModuleStatus();
    this._renderLogEntries();
  },

  /* Renderiza a lista de módulos/dispositivos com seu status */
  _renderModuleStatus() {
    const container = document.getElementById('moduleStatus');
    if (!container) return;

    container.innerHTML = '';
    AppState.modules.forEach(module => {
      const item = document.createElement('div');
      item.className = 'list-item';
      item.innerHTML = `
        <div class="item-info">
          <h4>${module.name}</h4>
          <p>Status: <span class="${module.active ? 'status-ok' : 'status-danger'}">
            ${module.active ? 'Ativo' : 'Inativo'}
          </span></p>
        </div>
        <span class="badge-status ${module.active ? 'active' : 'inactive'}">
          ${module.active ? 'Online' : 'Offline'}
        </span>
      `;
      container.appendChild(item);
    });
  },

  /* Renderiza as entradas do log de eventos */
  _renderLogEntries() {
    const container = document.getElementById('logsContainer');
    if (!container) return;

    container.innerHTML = '';

    if (AppState.logs.length === 0) {
      container.innerHTML = `
        <div class="list-item">
          <div class="item-info">
            <p>Nenhum evento registrado ainda.</p>
          </div>
        </div>
      `;
      return;
    }

    AppState.logs.forEach(log => {
      const item = document.createElement('div');
      item.className = 'list-item';
      item.innerHTML = `
        <div class="item-info">
          <h4>
            <span class="log-type-badge ${log.type}">${log.type.toUpperCase()}</span>
            &nbsp;${log.title}
          </h4>
          <p>${log.message}</p>
        </div>
        <span class="log-timestamp">${log.timestamp}</span>
      `;
      container.appendChild(item);
    });
  },
};
