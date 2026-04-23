/*
 * main.js - Bootstrap da interface Astro Verde.
 *
 * Responsabilidades:
 * - inicializar modulos visuais
 * - registrar eventos globais de botao/modal
 * - escolher fonte de dados (mock ou backend API)
 */

const Modal = {
  /* Exibe modal padrao para feedback rapido de operacao. */
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

  /* Fecha modal principal de feedback. */
  close() {
    document.getElementById('customModal').classList.remove('show');
  },
};

/* Fecha modal principal (mantida como funcao global para botoes do HTML). */
function closeModal() {
  Modal.close();
}

/* Fecha modal de formularios de insumos e safras. */
function closeFormModal() {
  document.getElementById('formModal').classList.remove('show');
}

/* Mostra resumo de notificacoes ativas e limpa contador de nao lidas. */
function showNotificationModal() {
  const activeAlerts = AppState.alerts.filter((alert) => alert.active !== false);
  if (activeAlerts.length === 0) {
    Modal.show('Notificacoes', 'Nenhum alerta ativo. Sistema operando normalmente.', 'success');
  } else {
    const lines = activeAlerts
      .map((alert) => `- [${alert.type.toUpperCase()}] ${alert.title}`)
      .join('\n');
    Modal.show(`${activeAlerts.length} alerta(s) ativo(s)`, lines, 'warning');
  }

  AppState.unreadNotifications = 0;
  Alerts._updateBadge();
}

/* Aciona rotina de correcao de pH no simulador local. */
function correctPh() {
  MockSimulator.correctPh();
  Modal.show('Ajuste de pH', 'Bomba dosadora acionada. pH estabilizado em 6.0.', 'success');
  Dashboard.refresh();
}

/* Dispara falha de fluxo NFT para validar alertas criticos. */
function simulateNftFailure() {
  MockSimulator.simulateNftFailure();
  Modal.show(
    'CRITICO: Fluxo NFT Interrompido',
    'Interrupcao detectada no fluxo laminar. Verifique bombas e tubulacao.',
    'danger'
  );
  Dashboard.refresh();
}

/* Dispara falha de iluminacao para validar regra de lampada queimada. */
function simulateBurnedLight() {
  MockSimulator.simulateLightBurn();
  Modal.show(
    'CRITICO: Iluminacao Queimada',
    'Comando enviado, mas luminosidade insuficiente detectada. Verifique lampada LED.',
    'danger'
  );
}

/* Exporta CSV local para uso rapido em apresentacoes e debug. */
function downloadCsv() {
  exportMockCsv();
  Modal.show('Exportacao Concluida', 'Arquivo CSV gerado com os dados atuais dos sensores.', 'success');
  Logger.add('info', 'Exportacao CSV', 'Relatorio de sensores exportado com sucesso.');
}

/* Registra handlers dos botoes globais declarados com data-ui-action. */
function bindStaticActions() {
  const handlers = {
    'show-notifications': showNotificationModal,
    'download-csv': downloadCsv,
    'correct-ph': correctPh,
    'simulate-nft-failure': simulateNftFailure,
    'simulate-light-burn': simulateBurnedLight,
    'inventory-add': () => Inventory.openAddForm(),
    'harvest-add': () => Harvest.openAddForm(),
    'close-modal': closeModal,
    'close-form-modal': closeFormModal,
  };

  document.querySelectorAll('[data-ui-action]').forEach((element) => {
    const handler = handlers[element.dataset.uiAction];
    if (handler) element.addEventListener('click', handler);
  });
}

/* Gera CSV com snapshot atual do estado e pontos do grafico ambiental. */
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
    const temperatures = Charts.envChartInstance.data.datasets[0].data;
    const humidities = Charts.envChartInstance.data.datasets[1].data;

    labels.forEach((label, index) => {
      rows.push([label, '', '', '', temperatures[index] ?? '', humidities[index] ?? '', '', '', '', '']);
    });
  }

  const csv = rows.map((row) => row.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `astro-verde-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

/*
 * Define pipeline de dados (mock x api) sem misturar com inicializacao de UI.
 * Isso facilita trocar para hardware real quando backend estiver conectado ao ESP32.
 */
function initializeDataSource() {
  if (AppState.dataSource === 'mock') {
    MockSimulator.start();
    document.getElementById('sysStatusText').textContent = 'Modo Simulacao Ativo';
    Logger.add('info', 'Sistema Iniciado', 'Astro Verde rodando com simulador local.');
    return;
  }

  ApiService.syncState();
  setInterval(() => ApiService.syncState(), 3000);
  document.getElementById('sysStatusText').textContent = 'Conectado ao Backend';
  Logger.add('info', 'Sistema Iniciado', 'Astro Verde conectado ao backend Node.js.');
}

/* Inicializa modulos de interface apos carregamento completo do DOM. */
document.addEventListener('DOMContentLoaded', () => {
  console.log('[Astro Verde] Iniciando interface...');

  bindStaticActions();
  Inventory.init();
  Harvest.init();

  document.getElementById('customModal').addEventListener('click', function onBackdropClick(event) {
    if (event.target === this) Modal.close();
  });

  document.getElementById('formModal').addEventListener('click', function onFormBackdropClick(event) {
    if (event.target === this) closeFormModal();
  });

  Charts.init();
  Inventory.render();
  Harvest.render();
  Alerts.render();
  Dashboard.refresh();
  Automation.init();
  Router.init();

  initializeDataSource();
  Logger.render();

  console.log('[Astro Verde] Interface pronta.');
});
