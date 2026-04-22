/*
 * main.js - Ponto de entrada da aplicação Astro Verde
 *
 * Inicializa os módulos, conecta os eventos da interface
 * e gerencia os modais da aplicação.
 */

const Modal = {
  show(title, message, type = 'warning') {
    document.getElementById('modalTitle').textContent = title;
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

function closeModal() {
  Modal.close();
}

function closeFormModal() {
  document.getElementById('formModal').classList.remove('show');
}

function showNotificationModal() {
  const active = AppState.alerts.filter(alert => alert.active !== false);
  if (active.length === 0) {
    Modal.show('Notificações', 'Nenhum alerta ativo. Sistema operando normalmente.', 'success');
  } else {
    const lines = active.map(alert => `• [${alert.type.toUpperCase()}] ${alert.title}`).join('\n');
    Modal.show(`${active.length} alerta(s) ativo(s)`, lines, 'warning');
  }

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
  exportMockCsv();
  Modal.show('Exportação Concluída', 'Arquivo CSV gerado com os dados atuais dos sensores.', 'success');
  Logger.add('info', 'Exportação CSV', 'Relatório de sensores exportado com sucesso.');
}

function bindStaticActions() {
  const handlers = {
    'show-notifications': showNotificationModal,
    'download-csv': downloadCSV,
    'correct-ph': corrigirPh,
    'simulate-nft-failure': simularFalhaNFT,
    'simulate-light-burn': simularQueimada,
    'inventory-add': () => Inventory.openAddForm(),
    'harvest-add': () => Harvest.openAddForm(),
    'close-modal': closeModal,
    'close-form-modal': closeFormModal,
  };

  document.querySelectorAll('[data-ui-action]').forEach(element => {
    const handler = handlers[element.dataset.uiAction];
    if (handler) {
      element.addEventListener('click', handler);
    }
  });
}

function exportMockCsv() {
  const sensors = AppState.sensors;
  const rows = [
    ['timestamp', 'ph', 'ec', 'tds', 'temperatura_C', 'umidade_pct', 'luminosidade_lux', 'nivel_reservatorio_pct', 'nft_flow', 'estado_iluminacao'],
    [
      new Date().toISOString(),
      sensors.ph.toFixed(2),
      sensors.ec.toFixed(2),
      sensors.tds,
      sensors.temperature.toFixed(1),
      sensors.humidity.toFixed(1),
      sensors.luminosity,
      sensors.waterLevel,
      sensors.nftFlow ? 'ativo' : 'falha',
      AppState.actuators.lightingState,
    ],
  ];

  if (Charts.envChartInstance) {
    const labels = Charts.envChartInstance.data.labels;
    const temps = Charts.envChartInstance.data.datasets[0].data;
    const hums = Charts.envChartInstance.data.datasets[1].data;
    labels.forEach((label, index) => {
      rows.push([label, '', '', '', temps[index] ?? '', hums[index] ?? '', '', '', '', '']);
    });
  }

  const csv = rows.map(row => row.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `astro-verde-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('[Astro Verde] Iniciando...');

  bindStaticActions();
  Inventory.init();
  Harvest.init();

  document.getElementById('customModal').addEventListener('click', function(event) {
    if (event.target === this) Modal.close();
  });

  document.getElementById('formModal').addEventListener('click', function(event) {
    if (event.target === this) closeFormModal();
  });

  Charts.init();
  Inventory.render();
  Harvest.render();
  Alerts.render();
  Dashboard.refresh();
  Automation.init();
  Router.init();

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
