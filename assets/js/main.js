/*
 * main.js — Ponto de Entrada da Aplicação
 *
 * Este é o arquivo que "liga" todos os módulos.
 * É carregado por último no index.html, depois que
 * todos os outros scripts já foram definidos.
 *
 * Responsabilidades:
 * 1. Esperar o DOM carregar (DOMContentLoaded)
 * 2. Inicializar os gráficos
 * 3. Fazer a primeira renderização das listas
 * 4. Iniciar o simulador (mock) ou conectar à API
 * 5. Expor funções globais para os botões do HTML
 *
 * Fluxo de dados:
 *   MockSimulator.start()
 *        ↓
 *   (a cada 3s) _tick()
 *        ↓
 *   AppState.sensors = novos valores
 *        ↓
 *   BusinessRules.evaluate() → Alerts.raise/resolve()
 *        ↓
 *   Dashboard.refresh() → atualiza DOM
 *        ↓
 *   Charts.addDataPoint() → atualiza gráfico
 */

/* ============================================================
   MODAL — utilitário de feedback visual
   Substitui o alert() nativo do browser.
   ============================================================ */
const Modal = {
  show(title, message, type = 'warning') {
    document.getElementById('modalTitle').textContent  = title;
    document.getElementById('modalMessage').textContent = message;

    const icon = document.getElementById('modalIcon');
    icon.className = 'ph modal-icon';

    if (type === 'success') {
      icon.classList.add('ph-check-circle', 'success');
    } else if (type === 'danger' || type === 'critical') {
      icon.classList.add('ph-warning-circle', 'danger');
    } else if (type === 'info') {
      icon.classList.add('ph-info', 'success');
    } else {
      icon.classList.add('ph-warning-circle', 'warning');
    }

    document.getElementById('customModal').classList.add('show');
  },

  close() {
    document.getElementById('customModal').classList.remove('show');
    AppState.unreadNotifications = 0;
    Alerts._updateBadge();
  },
};

/* ============================================================
   FUNÇÕES GLOBAIS — chamadas pelos atributos onclick do HTML
   Ficam no escopo global (window) para que o HTML as encontre.
   ============================================================ */

// Navegação entre abas
function switchTab(tabId, element) {
  Router.navigate(tabId, element);
}

// Fecha o modal
function closeModal() {
  Modal.close();
}

// Exibe notificações ao clicar no sino
function showNotificationModal() {
  const count = AppState.alerts.length;
  const msg = count > 0
    ? `Há ${count} alerta(s) ativo(s): ${AppState.alerts.map(a => a.title).join(', ')}.`
    : 'Nenhum alerta ativo no momento. Sistema operando normalmente.';
  Modal.show('Notificações', msg, count > 0 ? 'warning' : 'success');
}

// Corrige pH manualmente (aciona bomba dosadora)
function corrigirPh() {
  MockSimulator.correctPh();
  Modal.show('Ajuste de pH', 'Bomba dosadora acionada. pH estabilizado em 6.0.', 'success');
  Dashboard.refresh();
}

// Simula falha no fluxo NFT
function simularFalhaNFT() {
  MockSimulator.simulateNftFailure();
  Modal.show(
    'CRÍTICO: Fluxo NFT Interrompido',
    'Interrupção detectada no fluxo laminar de nutrientes! Verifique as bombas imediatamente. Sistema restaurará em 10 segundos.',
    'danger'
  );
  Dashboard.refresh();
}

// Simula lâmpada queimada
function simularQueimada() {
  MockSimulator.simulateLightBurn();
  Modal.show(
    'CRÍTICO: Iluminação Queimada',
    'Comando de ligar enviado, mas luminosidade não detectada. Verifique a lâmpada LED.',
    'danger'
  );
}

// Exporta dados como CSV
function downloadCSV() {
  if (AppState.dataSource === 'api') {
    ApiService.exportCsv();
  } else {
    // No modo mock, gera um CSV simples com os dados atuais
    _exportMockCsv();
    Modal.show(
      'Exportação Concluída',
      'Relatório CSV gerado com os dados atuais do simulador.',
      'success'
    );
    Logger.add('info', 'Exportação', 'Arquivo CSV exportado com sucesso.');
  }
}

// Gera e baixa um CSV com os dados do mock
function _exportMockCsv() {
  const s = AppState.sensors;
  const rows = [
    ['timestamp', 'ph', 'ec', 'tds', 'temperatura', 'umidade', 'luminosidade', 'nivel_reservatorio'],
    [new Date().toISOString(), s.ph.toFixed(2), s.ec.toFixed(2), s.tds, s.temperature.toFixed(1), s.humidity.toFixed(1), s.luminosity, s.waterLevel],
  ];

  // Usa dados históricos de temperatura do gráfico se disponível
  if (Charts.envChartInstance) {
    const labels = Charts.envChartInstance.data.labels;
    const temps  = Charts.envChartInstance.data.datasets[0].data;
    const hums   = Charts.envChartInstance.data.datasets[1].data;
    labels.forEach((label, i) => {
      rows.push([label, '', '', '', temps[i] || '', hums[i] || '', '', '']);
    });
  }

  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `astro-verde-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// Adicionar insumo
function addInsumo() {
  Inventory.add();
}

// Adicionar safra
function addSafra() {
  Harvest.add();
}

/* ============================================================
   INICIALIZAÇÃO DA APLICAÇÃO
   DOMContentLoaded garante que o HTML está pronto antes
   de tentar manipular elementos.
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  console.log('[Astro Verde] Iniciando aplicação...');

  // 1. Inicializa gráficos
  Charts.init();

  // 2. Renderiza dados iniciais das listas
  Inventory.render();
  Harvest.render();
  Logger.render();
  Alerts.render();
  Dashboard.refresh();

  // 3. Inicia o simulador de sensores (modo mock)
  if (AppState.dataSource === 'mock') {
    MockSimulator.start();
    console.log('[Astro Verde] Modo mock ativo — dados simulados');
  } else {
    // Modo API: sincroniza com o backend a cada 3 segundos
    ApiService.syncState();
    setInterval(() => ApiService.syncState(), 3000);
    console.log('[Astro Verde] Modo API ativo — conectado ao backend');
  }

  // 4. Registra log de inicialização
  Logger.add('info', 'Sistema Iniciado', 'Astro Verde inicializado com sucesso em modo mock.');

  console.log('[Astro Verde] Aplicação pronta!');
});
