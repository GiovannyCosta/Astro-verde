/*
 * router.js - Navegação entre abas
 *
 * Mostra/oculta sections sem recarregar a página.
 * Os links usam data-tab + hash (#aba), enquanto o JS
 * intercepta o clique e atualiza a view ativa.
 */

const Router = {

  titles: {
    dashboard: 'Visão Geral — Monitoramento Contínuo',
    estoque:   'Gestão de Insumos (RF11)',
    safras:    'Planejamento e Registro de Safra (RF04/RF05)',
    log:       'Logs do Sistema',
  },

  init() {
    document.querySelectorAll('.nav-item[data-tab]').forEach(link => {
      link.addEventListener('click', event => {
        event.preventDefault();
        this.navigate(link.dataset.tab, link);
      });
    });

    const initialTab = window.location.hash.replace('#', '');
    this.navigate(initialTab || 'dashboard');
  },

  navigate(tabId, element = null) {
    const activeTab = this.titles[tabId] ? tabId : 'dashboard';
    const activeItem =
      element ||
      document.querySelector(`.nav-item[data-tab="${activeTab}"]`) ||
      document.querySelector('.nav-item[data-tab="dashboard"]');

    if (!activeItem) return;

    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    activeItem.classList.add('active');

    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
    const target = document.getElementById(activeTab);
    if (target) target.classList.add('active');

    const titleEl = document.getElementById('pageTitle');
    if (titleEl) titleEl.textContent = this.titles[activeTab] || activeTab;

    if (window.location.hash !== `#${activeTab}`) {
      history.replaceState(null, '', `#${activeTab}`);
    }

    if (activeTab === 'log') Logger.render();
    if (activeTab === 'estoque') Inventory.render();
    if (activeTab === 'safras') Harvest.render();
  },
};
