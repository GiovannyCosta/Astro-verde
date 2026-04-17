-- schema.sql — Estrutura do Banco de Dados Astro Verde
--
-- Este arquivo cria todas as tabelas do sistema.
-- Banco: SQLite (desenvolvimento) / PostgreSQL (produção futura)
--
-- Para executar: node src/database/seed.js
-- O seed.js lê este arquivo e executa no SQLite.


-- ============================================================
-- DISPOSITIVOS — ESP32/Arduino registrados no sistema
-- No futuro, cada dispositivo físico terá uma linha aqui.
-- ============================================================
CREATE TABLE IF NOT EXISTS devices (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id   TEXT    NOT NULL UNIQUE,  -- ex: "astroverde-node-01"
  name        TEXT    NOT NULL,
  location    TEXT,
  firmware    TEXT,
  active      INTEGER DEFAULT 1,        -- SQLite usa 0/1 para booleano
  created_at  TEXT    DEFAULT (datetime('now'))
);

-- ============================================================
-- SENSORES — tipos de sensor cadastrados
-- ============================================================
CREATE TABLE IF NOT EXISTS sensors (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id   INTEGER REFERENCES devices(id),
  sensor_type TEXT    NOT NULL,         -- 'ph', 'ec', 'temperature', etc.
  unit        TEXT    NOT NULL,         -- 'pH', 'mS/cm', '°C', etc.
  description TEXT,
  active      INTEGER DEFAULT 1
);

-- ============================================================
-- LEITURAS — série temporal dos sensores
-- Cada leitura é um ponto no tempo de um sensor específico.
-- ============================================================
CREATE TABLE IF NOT EXISTS readings (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id      TEXT    NOT NULL,
  sensor_type    TEXT    NOT NULL,
  value          REAL    NOT NULL,
  unit           TEXT    NOT NULL,
  quality        TEXT    DEFAULT 'ok',    -- 'ok', 'warning', 'invalid', 'stale'
  nft_flow       INTEGER DEFAULT 1,       -- 1=circulando, 0=interrompido
  lighting_state TEXT    DEFAULT 'acesa', -- 'acesa', 'apagada', 'queimada'
  temp_control   TEXT    DEFAULT 'normal',-- 'normal', 'cooling', 'heating', 'protection'
  collected_at   TEXT    DEFAULT (datetime('now')),
  is_retransmit  INTEGER DEFAULT 0        -- 1 se foi enviado após contingência
);

-- ============================================================
-- ATUADORES — estado atual dos atuadores físicos
-- ============================================================
CREATE TABLE IF NOT EXISTS actuators (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  actuator_type   TEXT    NOT NULL UNIQUE, -- 'lighting', 'cooling', 'heating', 'ph_pump'
  command         TEXT    NOT NULL,        -- 'on', 'off', 'reduce'
  power_pct       INTEGER DEFAULT 100,     -- potência em %
  updated_at      TEXT    DEFAULT (datetime('now'))
);

-- ============================================================
-- ALERTAS — alertas gerados pelas regras de negócio
-- ============================================================
CREATE TABLE IF NOT EXISTS alerts (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  alert_type  TEXT NOT NULL,              -- 'ph_out_of_range', 'nft_failure', etc.
  severity    TEXT NOT NULL,              -- 'info', 'warning', 'critical'
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  active      INTEGER DEFAULT 1,          -- 1=ativo, 0=resolvido
  opened_at   TEXT DEFAULT (datetime('now')),
  resolved_at TEXT
);

-- ============================================================
-- LOGS — histórico de eventos do sistema
-- ============================================================
CREATE TABLE IF NOT EXISTS system_logs (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  log_type   TEXT NOT NULL,               -- 'info', 'warning', 'critical', 'success'
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- CONFIGURAÇÕES — faixas ideais por cultura
-- Permite ajustar limites sem mudar código.
-- ============================================================
CREATE TABLE IF NOT EXISTS sensor_configs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  param       TEXT NOT NULL UNIQUE,       -- 'ph_min', 'ph_max', 'temp_max', etc.
  value       REAL NOT NULL,
  description TEXT,
  updated_at  TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- INVENTÁRIO — insumos e materiais
-- ============================================================
CREATE TABLE IF NOT EXISTS inventory (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  quantity    REAL    NOT NULL,
  unit        TEXT    NOT NULL,
  min_stock   REAL    DEFAULT 0,
  updated_at  TEXT    DEFAULT (datetime('now'))
);

-- ============================================================
-- SAFRAS — lotes de cultivo
-- ============================================================
CREATE TABLE IF NOT EXISTS harvests (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  crop         TEXT    NOT NULL,
  lot          TEXT    NOT NULL,
  planted_at   TEXT    NOT NULL,
  harvest_at   TEXT    NOT NULL,
  total_days   INTEGER NOT NULL,
  current_day  INTEGER DEFAULT 0,
  status       TEXT    DEFAULT 'growing',  -- 'growing', 'final', 'done'
  created_at   TEXT    DEFAULT (datetime('now'))
);
