/*
 * modules/harvest.js — Planejamento de Safras (RF04/RF05)
 *
 * Gerencia o registro e exibição das safras em andamento.
 * Cada safra tem: cultura, lote, data de plantio,
 * previsão de colheita e progresso.
 *
 * No modo mock, os dados ficam em memória.
 * No modo API, viriam de GET /api/harvests.
 */

const Harvest = {

  /* Safras em andamento */
  items: [
    {
      id: 1,
      crop: 'Alface Crespa',
      lot: 'Lote 04A',
      plantedAt: '01/04/2026',
      harvestAt: '10/05/2026',
      totalDays: 40,
      currentDay: 7,
      status: 'growing',
    },
    {
      id: 2,
      crop: 'Manjericão',
      lot: 'Lote 02B',
      plantedAt: '15/03/2026',
      harvestAt: '25/04/2026',
      totalDays: 40,
      currentDay: 24,
      status: 'final',
    },
  ],

  /* Mapeia status para rótulo e cor */
  _statusLabel(status) {
    const map = {
      growing: { label: 'Em Andamento', class: 'status-ok' },
      final:   { label: 'Fase Final',   class: 'status-ok' },
      done:    { label: 'Colhida',      class: 'status-alert' },
    };
    return map[status] || { label: status, class: '' };
  },

  /* Renderiza a lista de safras na aba Safras */
  render() {
    const container = document.querySelector('#safras .list-group');
    if (!container) return;

    container.innerHTML = '';
    this.items.forEach(item => {
      const { label, class: cls } = this._statusLabel(item.status);
      const div = document.createElement('div');
      div.className = 'list-item';
      div.innerHTML = `
        <div class="item-info">
          <h4>${item.crop} — ${item.lot}</h4>
          <p>Plantio: ${item.plantedAt} | Colheita prevista: ${item.harvestAt}</p>
        </div>
        <div style="text-align: right;">
          <div class="status-text ${cls}" style="font-size:0.85rem;">${label}</div>
          <div style="font-size:0.75rem;color:var(--text-muted);">
            Dia ${item.currentDay}/${item.totalDays}
          </div>
        </div>
      `;
      container.appendChild(div);
    });
  },

  /* Simula adição de safra */
  add() {
    Modal.show(
      'Nova Safra',
      'Funcionalidade de planejamento de safra será integrada ao backend em breve.',
      'info'
    );
    Logger.add('info', 'Safras', 'Tentativa de cadastro de nova safra.');
  },
};
