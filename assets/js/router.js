/*
 * router.js — Navegação entre Abas (SPA simples)
 *
 * Gerencia qual seção/aba está visível na tela.
 * Como não usamos um framework como React/Vue,
 * implementamos uma troca de views simples:
 * - esconde todas as sections
 * - mostra apenas a section com o id passado
 * - atualiza o item ativo no menu
 * - atualiza o título da página
 *
 * Isso é suficiente para uma SPA (Single Page Application)
 * de estudo sem a complexidade de React Router ou Vue Router.
 */

const Router = {

  /* Títulos de cada aba — exibidos na topbar */
  titles: {
    dashboard: 'Visão Geral — Monitoramento Contínuo',
    estoque:   'Gestão de Insumos (RF11)',
    safras:    'Planejamento e Registro de Safra (RF04/RF05)',
    log:       'Logs do Sistema',
  },

  /* ============================================================
     NAVEGAR PARA UMA ABA
     tabId: id da section HTML destino
     element: o <a> clicado no menu (para marcar como ativo)
     ============================================================ */
  navigate(tabId, element) {
    // Remove classe 'active' de todos os itens do menu
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    element.classList.add('active');

    // Esconde todas as sections e mostra apenas a selecionada
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
    const target = document.getElementById(tabId);
    if (target) target.classList.add('active');

    // Atualiza o título da topbar
    const titleEl = document.getElementById('pageTitle');
    if (titleEl) titleEl.textContent = this.titles[tabId] || tabId;

    // Se for a aba de log, renderiza o log atualizado
    if (tabId === 'log') {
      Logger.render();
    }

    // Se for a aba de insumos, re-renderiza a lista
    if (tabId === 'estoque') {
      Inventory.render();
    }

    // Se for a aba de safras, re-renderiza a lista
    if (tabId === 'safras') {
      Harvest.render();
    }
  },
};
