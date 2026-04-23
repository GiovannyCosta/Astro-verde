/*
 * router.js - Navegacao simples por hash entre secoes da tela.
 *
 * Mantem a troca de abas desacoplada dos modulos de negocio.
 */

const Router = {
  titles: {
    dashboard: 'Visao Geral - Monitoramento Continuo',
    estoque: 'Gestao de Insumos (RF11)',
    safras: 'Planejamento e Registro de Safra (RF04/RF05)',
    automacao: 'Automacao e Controle via Celular',
    log: 'Logs do Sistema',
  },

  /* Conecta links de menu e define aba inicial. */
  init() {
    document.querySelectorAll('.nav-item[data-tab]').forEach((link) => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        this.navigate(link.dataset.tab, link);
      });
    });

    const initialTab = window.location.hash.replace('#', '');
    this.navigate(initialTab || 'dashboard');
  },

  /* Ativa aba solicitada e renderiza modulos dependentes quando necessario. */
  navigate(tabId, triggerElement = null) {
    const activeTab = this.titles[tabId] ? tabId : 'dashboard';
    const menuItem = triggerElement
      || document.querySelector(`.nav-item[data-tab="${activeTab}"]`)
      || document.querySelector('.nav-item[data-tab="dashboard"]');

    if (!menuItem) return;

    document.querySelectorAll('.nav-item').forEach((item) => item.classList.remove('active'));
    menuItem.classList.add('active');

    document.querySelectorAll('.view-section').forEach((section) => section.classList.remove('active'));
    const targetSection = document.getElementById(activeTab);
    if (targetSection) targetSection.classList.add('active');

    const titleElement = document.getElementById('pageTitle');
    if (titleElement) titleElement.textContent = this.titles[activeTab] || activeTab;

    if (window.location.hash !== `#${activeTab}`) {
      history.replaceState(null, '', `#${activeTab}`);
    }

    if (activeTab === 'log') Logger.render();
    if (activeTab === 'estoque') Inventory.render();
    if (activeTab === 'safras') Harvest.render();
    if (activeTab === 'automacao') Automation.init();
  },
};
