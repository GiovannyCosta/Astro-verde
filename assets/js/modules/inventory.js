/*
 * modules/inventory.js — Gestão de Insumos (RF11)
 */

const Inventory = {

  items: [
    { id: 1, name: 'Solução Nutritiva A (Macronutrientes)', quantity: 15,   unit: 'L',  minStock: 5    },
    { id: 2, name: 'Solução Nutritiva B (Micronutrientes)', quantity: 12,   unit: 'L',  minStock: 5    },
    { id: 3, name: 'Solução Redutora de pH',                quantity: 2,    unit: 'L',  minStock: 3    },
    { id: 4, name: 'Sementes — Alface Crespa',              quantity: 5000, unit: 'un', minStock: 1000 },
  ],

  _nextId: 5,

  render() {
    const container = document.getElementById('inventoryList');
    if (!container) return;

    if (this.items.length === 0) {
      container.innerHTML = '<div class="list-item"><div class="item-info"><p>Nenhum insumo cadastrado.</p></div></div>';
      return;
    }

    container.innerHTML = '';
    this.items.forEach(item => {
      const isLow = item.quantity <= item.minStock;
      const div = document.createElement('div');
      div.className = 'list-item';
      if (isLow) div.style.borderLeft = '4px solid var(--warning-yellow)';

      div.innerHTML = `
        <div class="item-info">
          <h4>${item.name}</h4>
          <p>Quantidade atual: ${item.quantity} ${item.unit} &nbsp;|&nbsp; Mínimo: ${item.minStock} ${item.unit}</p>
        </div>
        <div style="display:flex;align-items:center;gap:.75rem">
          <span class="badge-status ${isLow ? 'warning' : 'active'}">
            ${isLow ? 'Estoque Baixo' : 'Estoque OK'}
          </span>
          <button class="btn btn-primary" style="padding:.3rem .7rem;font-size:.8rem"
            onclick="Inventory.openEditForm(${item.id})">Editar</button>
          <button class="btn btn-danger" style="padding:.3rem .7rem;font-size:.8rem"
            onclick="Inventory.remove(${item.id})">Remover</button>
        </div>
      `;
      container.appendChild(div);
    });
  },

  openAddForm() {
    document.getElementById('formModalTitle').textContent = 'Novo Insumo';
    document.getElementById('formModalBody').innerHTML = `
      <div style="display:flex;flex-direction:column;gap:.75rem">
        <div>
          <label style="font-size:.85rem;font-weight:600;color:var(--text-metal)">Nome do Insumo</label>
          <input id="fi_name" type="text" placeholder="Ex: Solução Nutritiva A"
            style="width:100%;margin-top:.35rem;padding:.55rem .75rem;border:1px solid rgba(0,0,0,.12);border-radius:6px;font-size:.9rem;font-family:var(--font-main)">
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem">
          <div>
            <label style="font-size:.85rem;font-weight:600;color:var(--text-metal)">Quantidade</label>
            <input id="fi_qty" type="number" min="0" placeholder="0"
              style="width:100%;margin-top:.35rem;padding:.55rem .75rem;border:1px solid rgba(0,0,0,.12);border-radius:6px;font-size:.9rem;font-family:var(--font-main)">
          </div>
          <div>
            <label style="font-size:.85rem;font-weight:600;color:var(--text-metal)">Unidade</label>
            <select id="fi_unit"
              style="width:100%;margin-top:.35rem;padding:.55rem .75rem;border:1px solid rgba(0,0,0,.12);border-radius:6px;font-size:.9rem;font-family:var(--font-main)">
              <option value="L">L (litros)</option>
              <option value="mL">mL</option>
              <option value="kg">kg</option>
              <option value="g">g</option>
              <option value="un">un (unidades)</option>
            </select>
          </div>
        </div>
        <div>
          <label style="font-size:.85rem;font-weight:600;color:var(--text-metal)">Estoque Mínimo (alerta abaixo disso)</label>
          <input id="fi_min" type="number" min="0" placeholder="0"
            style="width:100%;margin-top:.35rem;padding:.55rem .75rem;border:1px solid rgba(0,0,0,.12);border-radius:6px;font-size:.9rem;font-family:var(--font-main)">
        </div>
      </div>
    `;

    document.getElementById('formModalSave').onclick = () => {
      const name = document.getElementById('fi_name').value.trim();
      const qty  = parseFloat(document.getElementById('fi_qty').value);
      const unit = document.getElementById('fi_unit').value;
      const min  = parseFloat(document.getElementById('fi_min').value) || 0;

      if (!name) { alert('Informe o nome do insumo.'); return; }
      if (isNaN(qty) || qty < 0) { alert('Informe uma quantidade válida.'); return; }

      this.items.push({ id: this._nextId++, name, quantity: qty, unit, minStock: min });
      Logger.add('success', 'Insumo Adicionado', `${name} (${qty} ${unit}) cadastrado.`);
      closeFormModal();
      this.render();
    };

    document.getElementById('formModal').classList.add('show');
  },

  openEditForm(id) {
    const item = this.items.find(i => i.id === id);
    if (!item) return;

    document.getElementById('formModalTitle').textContent = 'Editar Insumo';
    document.getElementById('formModalBody').innerHTML = `
      <div style="display:flex;flex-direction:column;gap:.75rem">
        <div>
          <label style="font-size:.85rem;font-weight:600;color:var(--text-metal)">Nome do Insumo</label>
          <input id="fi_name" type="text" value="${item.name}"
            style="width:100%;margin-top:.35rem;padding:.55rem .75rem;border:1px solid rgba(0,0,0,.12);border-radius:6px;font-size:.9rem;font-family:var(--font-main)">
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem">
          <div>
            <label style="font-size:.85rem;font-weight:600;color:var(--text-metal)">Quantidade</label>
            <input id="fi_qty" type="number" min="0" value="${item.quantity}"
              style="width:100%;margin-top:.35rem;padding:.55rem .75rem;border:1px solid rgba(0,0,0,.12);border-radius:6px;font-size:.9rem;font-family:var(--font-main)">
          </div>
          <div>
            <label style="font-size:.85rem;font-weight:600;color:var(--text-metal)">Unidade</label>
            <input id="fi_unit" type="text" value="${item.unit}"
              style="width:100%;margin-top:.35rem;padding:.55rem .75rem;border:1px solid rgba(0,0,0,.12);border-radius:6px;font-size:.9rem;font-family:var(--font-main)">
          </div>
        </div>
        <div>
          <label style="font-size:.85rem;font-weight:600;color:var(--text-metal)">Estoque Mínimo</label>
          <input id="fi_min" type="number" min="0" value="${item.minStock}"
            style="width:100%;margin-top:.35rem;padding:.55rem .75rem;border:1px solid rgba(0,0,0,.12);border-radius:6px;font-size:.9rem;font-family:var(--font-main)">
        </div>
      </div>
    `;

    document.getElementById('formModalSave').onclick = () => {
      const name = document.getElementById('fi_name').value.trim();
      const qty  = parseFloat(document.getElementById('fi_qty').value);
      const unit = document.getElementById('fi_unit').value.trim() || item.unit;
      const min  = parseFloat(document.getElementById('fi_min').value) || 0;

      if (!name) { alert('Informe o nome.'); return; }
      if (isNaN(qty) || qty < 0) { alert('Informe uma quantidade válida.'); return; }

      item.name = name; item.quantity = qty; item.unit = unit; item.minStock = min;
      Logger.add('info', 'Insumo Atualizado', `${name} atualizado para ${qty} ${unit}.`);
      closeFormModal();
      this.render();
    };

    document.getElementById('formModal').classList.add('show');
  },

  remove(id) {
    const item = this.items.find(i => i.id === id);
    if (!item) return;
    if (!confirm(`Remover "${item.name}"?`)) return;
    this.items = this.items.filter(i => i.id !== id);
    Logger.add('warning', 'Insumo Removido', `${item.name} removido do estoque.`);
    this.render();
  },
};
