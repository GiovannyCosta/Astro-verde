/*
 * services/api.js - Camada central de integracao HTTP com backend.
 *
 * Toda chamada para API fica concentrada neste arquivo para manter:
 * - frontend limpo
 * - endpoint facil de trocar
 * - adaptacao simples para camada fisica futura (ESP32)
 */

const ApiService = {
  /* Retorna payload "data" do padrao novo sem quebrar formato legado. */
  _extractData(payload) {
    if (payload && typeof payload === 'object' && 'data' in payload) {
      return payload.data;
    }
    return payload;
  },

  /*
   * Monta URL completa a partir de chave de endpoint ou caminho direto.
   * Se receber "logs?limit=20", concatena com a base mantendo querystring.
   */
  _url(endpointKeyOrPath) {
    if (ApiConfig.endpoints[endpointKeyOrPath]) {
      return `${ApiConfig.baseUrl}${ApiConfig.endpoints[endpointKeyOrPath]}`;
    }

    const path = endpointKeyOrPath.startsWith('/') ? endpointKeyOrPath : `/${endpointKeyOrPath}`;
    return `${ApiConfig.baseUrl}${path}`;
  },

  /* Executa GET simples e devolve payload de negocio. */
  async _get(endpointKey) {
    const payload = await HttpClient.request(this._url(endpointKey));
    return this._extractData(payload);
  },

  /* Executa POST JSON e devolve payload de negocio. */
  async _post(endpointKey, body = {}) {
    const payload = await HttpClient.request(this._url(endpointKey), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return this._extractData(payload);
  },

  /* Busca sensores para atualizar cards do dashboard. */
  async getSensors() {
    return this._get('sensorsLatest');
  },

  /* Busca estado global do backend (pH, bomba, modo e origem da leitura). */
  async getSystemState() {
    return this._get('systemState');
  },

  /* Busca alertas ativos. */
  async getAlerts() {
    return this._get('alerts');
  },

  /* Busca logs recentes. */
  async getLogs(limit = 50) {
    return this._get(`logs?limit=${limit}`);
  },

  /* Envia comando de iluminacao para backend. */
  async setLighting(command, power = 100) {
    return this._post('lighting', { command, power });
  },

  /* Envia comando manual de bomba (preparado para camada fisica futura). */
  async setPumpState(ligar) {
    return this._post('controlPump', { ligar });
  },

  /* Alterna backend entre modo simulado e modo real. */
  async setSystemMode(modo) {
    return this._post('mode', { modo });
  },

  /* Envia leitura de pH para endpoint preparado para ESP32. */
  async sendPhReading(ph, deviceId) {
    return this._post('sensorPh', { ph, deviceId });
  },

  /* Abre exportacao CSV em nova aba. */
  exportCsv() {
    window.open(this._url('sensorsCsv'), '_blank');
  },

  /*
   * Sincroniza AppState com backend.
   * Atualiza tanto sensores/atuadores quanto estado global de sistema.
   */
  async syncState() {
    try {
      const [sensorData, systemData] = await Promise.all([
        this.getSensors(),
        this.getSystemState(),
      ]);

      if (sensorData && sensorData.sensors) {
        Object.assign(AppState.sensors, sensorData.sensors);
      }
      if (sensorData && sensorData.actuators) {
        Object.assign(AppState.actuators, sensorData.actuators);
      }

      if (systemData) {
        AppState.system.phAtual = systemData.ph;
        AppState.system.bombaLigada = systemData.bomba;
        AppState.system.modoAtual = systemData.modo;
        AppState.system.origemLeitura = systemData.origemLeitura;
        AppState.system.ultimaAtualizacao = systemData.ultimaAtualizacao;
      }

      Dashboard.refresh();
    } catch (err) {
      console.warn('[API] Falha na sincronizacao com backend:', err.message);
    }
  },
};
