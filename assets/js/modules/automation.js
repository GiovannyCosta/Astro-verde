/**
 * @module automation
 * @description Controles editaveis de fluxo e iluminacao com envio via backend.
 * @hardware bomba/iluminacao
 * @mode editable
 */

const Automation = {
  _isBound: false,

  init() {
    if (!this._isBound) {
      this._bindActions();
      this._isBound = true;
    }
  },

  _bindActions() {
    document.getElementById('btnSalvarFluxo')?.addEventListener('click', async () => {
      const valor = Number(document.getElementById('inputFluxo')?.value || 0);
      await ApiService.setFluxo(valor);
      AppState.sensors.fluxo_laminar = valor;
      AppState.sensorMeta.fluxo_laminar.lastReadingAt = new Date().toISOString();
      Logger.add('action', 'manual', `Fluxo laminar atualizado para ${valor} L/h`);
      Modal.show('Fluxo salvo', `Novo fluxo: ${valor} L/h`, 'success');
      Dashboard.refresh();
    });

    document.getElementById('btnSalvarLuz')?.addEventListener('click', async () => {
      const payload = {
        modo: document.getElementById('inputLuzModo')?.value || 'manual',
        on: (document.getElementById('inputLuzOn')?.value || 'on') === 'on',
        intensidade: Number(document.getElementById('inputLuzIntensidade')?.value || 100),
        horario_inicio: document.getElementById('inputLuzInicio')?.value || null,
        horario_fim: document.getElementById('inputLuzFim')?.value || null,
      };

      await ApiService.setLuz(payload);
      AppState.sensors.iluminacao = payload;
      AppState.sensorMeta.iluminacao.lastReadingAt = new Date().toISOString();
      Logger.add('action', 'manual', `Iluminacao atualizada: ${payload.modo}`);
      Modal.show('Iluminacao salva', 'Comando enfileirado para o ESP.', 'success');
      Dashboard.refresh();
    });
  },
};
