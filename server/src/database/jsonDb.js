/*
 * database/jsonDb.js — Banco de Dados em JSON (sem dependências nativas)
 *
 * Por que usar JSON em vez de SQLite aqui?
 * O SQLite requer compilação de código C nativo, o que exige ferramentas
 * como Visual Studio Build Tools ou Xcode. Para simplificar a instalação
 * e execução neste projeto de estudo, usamos um banco JSON puro em Node.js.
 *
 * Em produção, esse módulo seria substituído por um adaptador SQLite
 * ou PostgreSQL — os repositórios não mudam, apenas este arquivo.
 *
 * Funcionamento:
 * - Os dados ficam em memória (objetos JS)
 * - A cada alteração, são salvos em astroverde-data.json
 * - No próximo start, o arquivo é lido e o estado é restaurado
 *
 * Limitação:
 * - Não suporta transações reais ou queries SQL complexas
 * - Para volume maior, migrar para PostgreSQL (veja docs/integracao-hardware-futura.md)
 */

const fs   = require('fs');
const path = require('path');

const DATA_PATH = path.resolve(__dirname, '../../astroverde-data.json');

/* Estado em memória */
let db = {
  devices:      [],
  readings:     [],
  actuators:    [],
  alerts:       [],
  system_logs:  [],
  sensor_configs: [],
  inventory:    [],
  harvests:     [],
  _sequences:   {},  // auto-increment por tabela
};

/* ============================================================
   PERSISTÊNCIA — carrega e salva o arquivo JSON
   ============================================================ */

function load() {
  if (fs.existsSync(DATA_PATH)) {
    try {
      const raw = fs.readFileSync(DATA_PATH, 'utf8');
      db = JSON.parse(raw);
    } catch {
      console.warn('[DB] Arquivo corrompido, iniciando banco zerado.');
    }
  }
}

function save() {
  fs.writeFileSync(DATA_PATH, JSON.stringify(db, null, 2), 'utf8');
}

/* ============================================================
   AUTO-INCREMENT — ID único por tabela
   ============================================================ */

function nextId(table) {
  if (!db._sequences[table]) db._sequences[table] = 0;
  db._sequences[table]++;
  return db._sequences[table];
}

/* ============================================================
   HELPERS — operações CRUD genéricas
   ============================================================ */

function insert(table, record) {
  const row = {
    id: nextId(table),
    ...record,
    created_at: record.created_at || new Date().toISOString(),
  };
  db[table].push(row);
  save();
  return row;
}

function findAll(table, limit) {
  const rows = [...db[table]].reverse(); // mais recente primeiro
  return limit ? rows.slice(0, limit) : rows;
}

function findWhere(table, predicate) {
  return db[table].filter(predicate);
}

function findOne(table, predicate) {
  return db[table].find(predicate);
}

function updateWhere(table, predicate, updates) {
  db[table] = db[table].map(row => {
    if (predicate(row)) {
      return { ...row, ...updates, updated_at: new Date().toISOString() };
    }
    return row;
  });
  save();
}

/* ============================================================
   INICIALIZAÇÃO — seed de dados iniciais
   ============================================================ */

function initDatabase() {
  load();

  if (db.devices.length === 0) {
    console.log('[DB] Inserindo dados iniciais...');
    _seed();
  }

  console.log(`[DB] Banco JSON inicializado: ${DATA_PATH}`);
  return { insert, findAll, findWhere, findOne, updateWhere, save, getRaw: () => db };
}

function _seed() {
  insert('devices', {
    device_id: 'astroverde-sim-01',
    name: 'Simulador Local',
    location: 'Servidor Node.js',
    firmware: '1.0.0-mock',
    active: true,
  });

  insert('actuators', { actuator_type: 'lighting',   command: 'on',  power_pct: 100 });
  insert('actuators', { actuator_type: 'cooling',    command: 'off', power_pct: 0   });
  insert('actuators', { actuator_type: 'heating',    command: 'off', power_pct: 0   });
  insert('actuators', { actuator_type: 'ph_pump',    command: 'off', power_pct: 0   });

  const configs = [
    ['ph_min', 5.5], ['ph_max', 6.5],
    ['ec_min', 1.2], ['ec_max', 2.5],
    ['temp_min', 18], ['temp_max', 26], ['temp_crit', 30],
    ['lux_min', 200],
  ];
  configs.forEach(([param, value]) =>
    insert('sensor_configs', { param, value })
  );

  insert('inventory', { name: 'Solução Nutritiva A (Macronutrientes)', quantity: 15, unit: 'L', min_stock: 5 });
  insert('inventory', { name: 'Solução Nutritiva B (Micronutrientes)', quantity: 12, unit: 'L', min_stock: 5 });
  insert('inventory', { name: 'Solução Redutora de pH', quantity: 2, unit: 'L', min_stock: 3 });
  insert('inventory', { name: 'Sementes — Alface Crespa', quantity: 5000, unit: 'un', min_stock: 1000 });

  insert('harvests', { crop: 'Alface Crespa', lot: 'Lote 04A', planted_at: '2026-04-01', harvest_at: '2026-05-10', total_days: 40, current_day: 7,  status: 'growing' });
  insert('harvests', { crop: 'Manjericão',    lot: 'Lote 02B', planted_at: '2026-03-15', harvest_at: '2026-04-25', total_days: 40, current_day: 24, status: 'final'   });

  insert('system_logs', { log_type: 'info', title: 'Banco Inicializado', message: 'Dados iniciais inseridos com sucesso.' });

  console.log('[DB] Seed concluído.');
}

module.exports = { initDatabase };
