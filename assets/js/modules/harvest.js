/*
 * modules/harvest.js — Planejamento de Safras (RF04/RF05)
 */

const Harvest = {

  items: [
    { id: 1, crop: 'Alface Crespa', lot: 'Lote 04A', plantedAt: '01/04/2026', harvestAt: '10/05/2026', totalDays: 40, currentDay: 7,  status: 'growing' },
    { id: 2, crop: 'Manjericão',    lot: 'Lote 02B', plantedAt: '15/03/2026', harvestAt: '25/04/2026', totalDays: 40, currentDay: 24, status: 'final'   },
  ],

  _nextId: 3,

  _statusLabel(status) {
    const map = {
      growing: { label: 'Em Andamento', cls: 'status-ok'    },
      final:   { label: 'Fase Final',   cls: 'status-ok'    },
      done:    { label: 'Colhida',      cls: 'status-alert'  },
    };
    return map[status] || { label: status, cls: '' };
  },

  render() {
    const container = document.getElementById('harvestList');
    if (!container) return;

    if (this.items.length === 0) {
      container.innerHTML = '<div class="list-item"><div class="item-info"><p>Nenhuma safra cadastrada.</p></div></div>';
      return;
    }

    container.innerHTML = '';
    this.items.forEach(item => {
      const { label, cls } = this._statusLabel(item.status);
      const progress = Math.round((item.currentDay / item.totalDays) * 100);
      const div = document.createElement('div');
      div.className = 'list-item';
      div.innerHTML = `
        <div class="item-info" style="flex:1">
          <h4>${item.crop} — ${item.lot}</h4>
          <p>Plantio: ${item.plantedAt} &nbsp;|&nbsp; Colheita prevista: ${item.harvestAt}</p>
          <div style="margin-top:.5rem;background:#e8ece7;border-radius:6px;height:6px;overflow:hidden">
            <div style="width:${progress}%;height:100%;background:var(--secondary-green);border-radius:6px;transition:width .4s"></div>
          </div>
          <p style="font-size:.75rem;color:var(--text-muted);margin-top:.25rem">Dia ${item.currentDay} de ${item.totalDays} (${progress}%)</p>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:.5rem;margin-left:1rem;min-width:100px">
          <span class="status-text ${cls}" style="font-size:.85rem">${label}</span>
          <button class="btn btn-primary" style="padding:.3rem .7rem;font-size:.8rem"
            onclick="Harvest.openEditForm(${item.id})">Editar</button>
          <button class="btn btn-danger" style="padding:.3rem .7rem;font-size:.8rem"
            onclick="Harvest.remove(${item.id})">Remover</button>
        </div>
      `;
      container.appendChild(div);
    });
  },

  openAddForm() {
    document.getElementById('formModalTitle').textContent = 'Nova Safra';
    document.getElementById('formModalBody').innerHTML = `
      <div style="display:flex;flex-direction:column;gap:.75rem">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem">
          <div>
            <label style="font-size:.85rem;font-weight:600;color:var(--text-metal)">Cultura</label>
            <input id="fh_crop" type="text" placeholder="Ex: Alface Crespa"
              style="width:100%;margin-top:.35rem;padding:.55rem .75rem;border:1px solid rgba(0,0,0,.12);border-radius:6px;font-size:.9rem;font-family:var(--font-main)">
          </div>
          <div>
            <label style="font-size:.85rem;font-weight:600;color:var(--text-metal)">Lote</label>
            <input id="fh_lot" type="text" placeholder="Ex: Lote 05A"
              style="width:100%;margin-top:.35rem;padding:.55rem .75rem;border:1px solid rgba(0,0,0,.12);border-radius:6px;font-size:.9rem;font-family:var(--font-main)">
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem">
          <div>
            <label style="font-size:.85rem;font-weight:600;color:var(--text-metal)">Data de Plantio</label>
            <input id="fh_planted" type="date"
              style="width:100%;margin-top:.35rem;padding:.55rem .75rem;border:1px solid rgba(0,0,0,.12);border-radius:6px;font-size:.9rem;font-family:var(--font-main)">
          </div>
          <div>
            <label style="font-size:.85rem;font-weight:600;color:var(--text-metal)">Previsão de Colheita</label>
            <input id="fh_harvest" type="date"
              style="width:100%;margin-top:.35rem;padding:.55rem .75rem;border:1px solid rgba(0,0,0,.12);border-radius:6px;font-size:.9rem;font-family:var(--font-main)">
          </div>
        </div>
        <div>
          <label style="font-size:.85rem;font-weight:600;color:var(--text-metal)">Duração estimada (dias)</label>
          <input id="fh_days" type="number" min="1" placeholder="40"
            style="width:100%;margin-top:.35rem;padding:.55rem .75rem;border:1px solid rgba(0,0,0,.12);border-radius:6px;font-size:.9rem;font-family:var(--font-main)">
        </div>
      </div>
    `;

    document.getElementById('formModalSave').onclick = () => {
      const crop    = document.getElementById('fh_crop').value.trim();
      const lot     = document.getElementById('fh_lot').value.trim();
      const planted = document.getElementById('fh_planted').value;
      const harvest = document.getElementById('fh_harvest').value;
      const days    = parseInt(document.getElementById('fh_days').value) || 40;

      if (!crop || !lot) { alert('Informe a cultura e o lote.'); return; }
      if (!planted || !harvest) { alert('Informe as datas.'); return; }

      const fmt = d => d.split('-').reverse().join('/');
      this.items.push({ id: this._nextId++, crop, lot, plantedAt: fmt(planted), harvestAt: fmt(harvest), totalDays: days, currentDay: 0, status: 'growing' });
      Logger.add('success', 'Safra Cadastrada', `${crop} — ${lot} iniciada.`);
      closeFormModal();
      this.render();
    };

    document.getElementById('formModal').classList.add('show');
  },

  openEditForm(id) {
    const item = this.items.find(i => i.id === id);
    if (!item) return;

    document.getElementById('formModalTitle').textContent = 'Editar Safra';
    document.getElementById('formModalBody').innerHTML = `
      <div style="display:flex;flex-direction:column;gap:.75rem">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem">
          <div>
            <label style="font-size:.85rem;font-weight:600;color:var(--text-metal)">Cultura</label>
            <input id="fh_crop" type="text" value="${item.crop}"
              style="width:100%;margin-top:.35rem;padding:.55rem .75rem;border:1px solid rgba(0,0,0,.12);border-radius:6px;font-size:.9rem;font-family:var(--font-main)">
          </div>
          <div>
            <label style="font-size:.85rem;font-weight:600;color:var(--text-metal)">Lote</label>
            <input id="fh_lot" type="text" value="${item.lot}"
              style="width:100%;margin-top:.35rem;padding:.55rem .75rem;border:1px solid rgba(0,0,0,.12);border-radius:6px;font-size:.9rem;font-family:var(--font-main)">
          </div>
        </div>
        <div>
          <label style="font-size:.85rem;font-weight:600;color:var(--text-metal)">Dia atual do ciclo</label>
          <input id="fh_curday" type="number" min="0" max="${item.totalDays}" value="${item.currentDay}"
            style="width:100%;margin-top:.35rem;padding:.55rem .75rem;border:1px solid rgba(0,0,0,.12);border-radius:6px;font-size:.9rem;font-family:var(--font-main)">
        </div>
        <div>
          <label style="font-size:.85rem;font-weight:600;color:var(--text-metal)">Status</label>
          <select id="fh_status"
            style="width:100%;margin-top:.35rem;padding:.55rem .75rem;border:1px solid rgba(0,0,0,.12);border-radius:6px;font-size:.9rem;font-family:var(--font-main)">
            <option value="growing" ${item.status==='growing'?'selected':''}>Em Andamento</option>
            <option value="final"   ${item.status==='final'?'selected':''}>Fase Final</option>
            <option value="done"    ${item.status==='done'?'selected':''}>Colhida</option>
          </select>
        </div>
      </div>
    `;

    document.getElementById('formModalSave').onclick = () => {
      item.crop       = document.getElementById('fh_crop').value.trim() || item.crop;
      item.lot        = document.getElementById('fh_lot').value.trim() || item.lot;
      item.currentDay = parseInt(document.getElementById('fh_curday').value) || item.currentDay;
      item.status     = document.getElementById('fh_status').value;
      Logger.add('info', 'Safra Atualizada', `${item.crop} — ${item.lot} atualizado.`);
      closeFormModal();
      this.render();
    };

    document.getElementById('formModal').classList.add('show');
  },

  remove(id) {
    const item = this.items.find(i => i.id === id);
    if (!item) return;
    if (!confirm(`Remover safra "${item.crop} — ${item.lot}"?`)) return;
    this.items = this.items.filter(i => i.id !== id);
    Logger.add('warning', 'Safra Removida', `${item.crop} — ${item.lot} removida.`);
    this.render();
  },
};
