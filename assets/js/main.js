/*
 * main.js — Ponto de Entrada da Aplicação Astro Verde
 *
 * Inicializa todos os módulos, expõe as funções globais chamadas
 * pelos atributos onclick do HTML e gerencia os modais.
 */

/* ============================================================
   MODAL DE FEEDBACK (alertas, confirmações, erros)
   ============================================================ */
const Modal = {
  show(title, message, type = 'warning') {
    document.getElementById('modalTitle').textContent   = title;
    document.getElementById('modalMessage').textContent = message;

    const icon = document.getElementById('modalIcon');
    icon.className = 'ph modal-icon';
    if (type === 'success' || type === 'info') {
      icon.classList.add('ph-check-circle', 'success');
    } else if (type === 'danger' || type === 'critical') {
      icon.classList.add('ph-warning-circle', 'danger');
    } else {
      icon.classList.add('ph-warning-circle', 'warning');
    }

    document.getElementById('customModal').classList.add('show');
  },

  close() {
    document.getElementById('customModal').classList.remove('show');
  },
};

/* ============================================================
   FUNÇÕES GLOBAIS — chamadas por onclick no HTML
   ============================================================ */

function switchTab(tabId, element) {
  Router.navigate(tabId, element);
}

function closeModal() {
  Modal.close();
}

function closeFormModal() {
  document.getElementById('formModal').classList.remove('show');
}

function showNotificationModal() {
  const active = AppState.alerts.filter(a => a.active !== false);
  if (active.length === 0) {
    Modal.show('Notificações', 'Nenhum alerta ativo. Sistema operando normalmente.', 'success');
  } else {
    const lines = active.map(a => `• [${a.type.toUpperCase()}] ${a.title}`).join('\n');
    Modal.show(`${active.length} alerta(s) ativo(s)`, lines, 'warning');
  }
  // Zera o badge após leitura
  AppState.unreadNotifications = 0;
  Alerts._updateBadge();
}

function corrigirPh() {
  MockSimulator.correctPh();
  Modal.show('Ajuste de pH', 'Bomba dosadora acionada. pH estabilizado em 6.0.', 'success');
  Dashboard.refresh();
}

function simularFalhaNFT() {
  MockSimulator.simulateNftFailure();
  Modal.show(
    'CRÍTICO: Fluxo NFT Interrompido',
    'Interrupção detectada no fluxo laminar! Verifique as bombas imediatamente. O sistema restaurará automaticamente em 10 segundos.',
    'danger'
  );
  Dashboard.refresh();
}

function simularQueimada() {
  MockSimulator.simulateLightBurn();
  Modal.show(
    'CRÍTICO: Iluminação Queimada',
    'Comando de ligar enviado, mas luminosidade insuficiente detectada. Verifique a lâmpada LED.',
    'danger'
  );
}

function downloadCSV() {
  _exportMockCsv();
  Modal.show('Exportação Concluída', 'Arquivo CSV gerado com os dados atuais dos sensores.', 'success');
  Logger.add('info', 'Exportação CSV', 'Relatório de sensores exportado com sucesso.');
}

/* Gera e baixa CSV com leituras do histórico do gráfico */
function _exportMockCsv() {
  const s = AppState.sensors;
  const rows = [
    ['timestamp', 'ph', 'ec', 'tds', 'temperatura_C', 'umidade_pct', 'luminosidade_lux', 'nivel_reservatorio_pct', 'nft_flow', 'estado_iluminacao'],
    [new Date().toISOString(), s.ph.toFixed(2), s.ec.toFixed(2), s.tds, s.temperature.toFixed(1), s.humidity.toFixed(1), s.luminosity, s.waterLevel, s.nftFlow ? 'ativo' : 'falha', AppState.actuators.lightingState],
  ];

  if (Charts.envChartInstance) {
    const labels = Charts.envChartInstance.data.labels;
    const temps  = Charts.envChartInstance.data.datasets[0].data;
    const hums   = Charts.envChartInstance.data.datasets[1].data;
    labels.forEach((label, i) => {
      rows.push([label, '', '', '', temps[i] ?? '', hums[i] ?? '', '', '', '', '']);
    });
  }

  const csv  = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `astro-verde-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ============================================================
   INICIALIZAÇÃO
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  console.log('[Astro Verde] Iniciando...');

  // Fecha modais ao clicar fora deles
  document.getElementById('customModal').addEventListener('click', function(e) {
    if (e.target === this) Modal.close();
  });
  document.getElementById('formModal').addEventListener('click', function(e) {
    if (e.target === this) closeFormModal();
  });

  Charts.init();
  Inventory.render();
  Harvest.render();
  Alerts.render();
  Dashboard.refresh();

  if (AppState.dataSource === 'mock') {
    MockSimulator.start();
    document.getElementById('sysStatusText').textContent = 'Modo Simulação Ativo';
    Logger.add('info', 'Sistema Iniciado', 'Astro Verde rodando em modo de simulação. Sensores simulados ativos.');
  } else {
    ApiService.syncState();
    setInterval(() => ApiService.syncState(), 3000);
    document.getElementById('sysStatusText').textContent = 'Conectado ao Backend';
    Logger.add('info', 'Sistema Iniciado', 'Astro Verde conectado ao backend Node.js.');
  }

  Logger.render();
  console.log('[Astro Verde] Pronto!');
});
