/*
 * services/api.js — Cliente HTTP para o Backend Node.js
 *
 * Este módulo faz as requisições HTTP para a API REST
 * do servidor Node.js (server/src/server.js).
 *
 * Enquanto o backend não estiver rodando ou enquanto
 * AppState.dataSource === 'mock', o frontend usa o
 * simulador local (mock-data.js) e este módulo fica inativo.
 *
 * Para ativar o backend real:
 *   1. Rode: cd server && npm start
 *   2. Mude AppState.dataSource = 'api' em state.js
 *   3. O frontend passa a buscar dados em tempo real da API
 *
 * Endpoints disponíveis no backend:
 *   GET  /api/sensors/latest     → última leitura dos sensores
 *   GET  /api/alerts             → alertas ativos
 *   GET  /api/logs               → log de eventos
 *   POST /api/actuators/lighting → controle da iluminação
 *   POST /api/actuators/temperature → controle de temperatura
 *   POST /api/telemetry          → ponto de integração futura (ESP32)
 */

const ApiService = {

  /* URL base do backend — mude a porta se necessário */
  BASE_URL: 'http://localhost:3001/api',

  /* ============================================================
     BUSCAR ÚLTIMA LEITURA DOS SENSORES
     Retorna: { ph, ec, tds, temperature, humidity, luminosity, waterLevel, nftFlow }
     ============================================================ */
  async getSensors() {
    const res = await fetch(`${this.BASE_URL}/sensors/latest`);
    if (!res.ok) throw new Error('Falha ao buscar sensores');
    return res.json();
  },

  /* ============================================================
     BUSCAR ALERTAS ATIVOS
     ============================================================ */
  async getAlerts() {
    const res = await fetch(`${this.BASE_URL}/alerts`);
    if (!res.ok) throw new Error('Falha ao buscar alertas');
    return res.json();
  },

  /* ============================================================
     BUSCAR LOG DO SISTEMA
     ============================================================ */
  async getLogs(limit = 50) {
    const res = await fetch(`${this.BASE_URL}/logs?limit=${limit}`);
    if (!res.ok) throw new Error('Falha ao buscar logs');
    return res.json();
  },

  /* ============================================================
     CONTROLAR ILUMINAÇÃO
     command: 'on' | 'off'
     power:   0–100 (potência em %)
     ============================================================ */
  async setLighting(command, power = 100) {
    const res = await fetch(`${this.BASE_URL}/actuators/lighting`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command, power }),
    });
    if (!res.ok) throw new Error('Falha ao controlar iluminação');
    return res.json();
  },

  /* ============================================================
     EXPORTAR CSV
     ============================================================ */
  async exportCsv() {
    window.open(`${this.BASE_URL}/sensors/export/csv`, '_blank');
  },

  /* ============================================================
     SINCRONIZAR ESTADO DO APPSTATE COM O BACKEND
     Chamado periodicamente quando dataSource = 'api'.
     ============================================================ */
  async syncState() {
    try {
      const data = await this.getSensors();
      // Atualiza AppState com os dados reais da API
      Object.assign(AppState.sensors, data.sensors);
      Object.assign(AppState.actuators, data.actuators);
      Dashboard.refresh();
    } catch (err) {
      console.warn('[API] Falha na sincronização, mantendo mock:', err.message);
    }
  },
};
