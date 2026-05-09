/**
 * @module apiService
 * @description Integracao HTTP com backend para leitura e comandos em fila ESP.
 * @hardware esp32/esp8266
 * @mode real
 */

const ApiService = {
  _extractData(payload) {
    if (payload && typeof payload === 'object' && 'data' in payload) return payload.data;
    return payload;
  },

  _url(endpointKeyOrPath) {
    if (ApiConfig.endpoints[endpointKeyOrPath]) return `${ApiConfig.baseUrl}${ApiConfig.endpoints[endpointKeyOrPath]}`;
    const path = endpointKeyOrPath.startsWith('/') ? endpointKeyOrPath : `/${endpointKeyOrPath}`;
    return `${ApiConfig.baseUrl}${path}`;
  },

  async _get(endpointKey) {
    const payload = await HttpClient.request(this._url(endpointKey));
    return this._extractData(payload);
  },

  async _post(endpointKey, body = {}) {
    const payload = await HttpClient.request(this._url(endpointKey), {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    return this._extractData(payload);
  },

  getSensors() { return this._get('sensorsLatest'); },
  getSystemState() { return this._get('systemState'); },
  getAlerts() { return this._get('alerts'); },
  getLogs(limit = 50) { return this._get(`logs?limit=${limit}`); },
  setLighting(command, power = 100) { return this._post('lighting', { command, power }); },
  setPumpState(ligar) { return this._post('controlPump', { ligar }); },
  setSystemMode(modo) { return this._post('mode', { modo }); },
  sendPhReading(ph, deviceId) { return this._post('sensorPh', { ph, deviceId }); },
  setFluxo(valor) { return this._post('setFluxo', { valor }); },
  setLuz(payload) { return this._post('setLuz', payload); },

  async syncState() {
    try {
      const [sensorData, systemData] = await Promise.all([this.getSensors(), this.getSystemState()]);
      if (sensorData?.sensors) Object.assign(AppState.sensors, sensorData.sensors);
      if (sensorData?.actuators) Object.assign(AppState.actuators, sensorData.actuators);
      if (systemData) {
        AppState.system.phAtual = systemData.ph;
        AppState.system.bombaLigada = systemData.bomba;
        AppState.system.modoAtual = systemData.modo;
        AppState.system.origemLeitura = systemData.origemLeitura;
        AppState.system.ultimaAtualizacao = systemData.ultimaAtualizacao;
      }
      Dashboard.refresh();
    } catch (err) {
      console.warn('[API] Falha na sincronizacao:', err.message);
    }
  },
};
