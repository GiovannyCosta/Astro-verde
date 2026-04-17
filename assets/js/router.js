/*
 * router.js — Navegação entre Abas
 *
 * Mostra/oculta sections sem recarregar a página.
 * Os <a class="nav-item"> usam href="javascript:void(0)"
 * para evitar navegação acidental do browser.
 */

const Router = {

  titles: {
    dashboard: 'Visão Geral — Monitoramento Contínuo',
    estoque:   'Gestão de Insumos (RF11)',
    safras:    'Planejamento e Registro de Safra (RF04/RF05)',
    log:       'Logs do Sistema',
  },

  navigate(tabId, element) {
    // Atualiza item ativo no menu
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    element.classList.add('active');

    // Troca a seção visível
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
    const target = document.getElementById(tabId);
    if (target) target.classList.add('active');

    // Atualiza título da topbar
    const titleEl = document.getElementById('pageTitle');
    if (titleEl) titleEl.textContent = this.titles[tabId] || tabId;

    // Renderiza o conteúdo da aba selecionada
    if (tabId === 'log')     Logger.render();
    if (tabId === 'estoque') Inventory.render();
    if (tabId === 'safras')  Harvest.render();
  },
};
