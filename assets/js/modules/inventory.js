/*
 * modules/inventory.js — Gestão de Insumos (RF11)
 *
 * Controla e exibe o estoque de insumos da fazenda:
 * soluções nutritivas, corretores de pH e sementes.
 *
 * No modo mock, os dados ficam em memória.
 * No modo API, viriam de GET /api/inventory.
 */

const Inventory = {

  /* Dados de insumos — no futuro, carregados via API */
  items: [
    {
      id: 1,
      name: 'Solução Nutritiva A (Macronutrientes)',
      quantity: 15,
      unit: 'L',
      minStock: 5,
      status: 'normal',
    },
    {
      id: 2,
      name: 'Solução Nutritiva B (Micronutrientes)',
      quantity: 12,
      unit: 'L',
      minStock: 5,
      status: 'normal',
    },
    {
      id: 3,
      name: 'Solução Redutora de pH',
      quantity: 2,
      unit: 'L',
      minStock: 3,
      status: 'low', // abaixo do mínimo → alerta
    },
    {
      id: 4,
      name: 'Sementes — Alface Crespa',
      quantity: 5000,
      unit: 'un',
      minStock: 1000,
      status: 'normal',
    },
  ],

  /* Renderiza a lista de insumos na aba Insumos */
  render() {
    const container = document.querySelector('#estoque .list-group');
    if (!container) return;

    container.innerHTML = '';
    this.items.forEach(item => {
      const isLow = item.status === 'low';
      const div = document.createElement('div');
      div.className = 'list-item';
      if (isLow) div.style.borderLeft = '4px solid var(--warning-yellow)';

      div.innerHTML = `
        <div class="item-info">
          <h4>${item.name}</h4>
          <p>Volume atual: ${item.quantity} ${item.unit}</p>
        </div>
        <span class="badge-status ${isLow ? 'warning' : 'active'}">
          ${isLow ? 'Estoque Baixo' : 'Estoque Normal'}
        </span>
      `;
      container.appendChild(div);
    });
  },

  /* Simula adição de insumo */
  add() {
    Modal.show(
      'Adicionar Insumo',
      'Funcionalidade de cadastro de insumo será integrada ao backend em breve.',
      'info'
    );
    Logger.add('info', 'Insumos', 'Tentativa de cadastro de novo insumo.');
  },
};
