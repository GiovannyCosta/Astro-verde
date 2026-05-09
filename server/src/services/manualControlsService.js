/**
 * @module manualControlsService
 * @description Persistencia de controles editaveis de fluxo e iluminacao com fila para ESP.
 * @hardware bomba/iluminacao
 * @mode editable
 */

function makeManualControlsService({ supabase, espService, logger, defaultDeviceId }) {
  async function saveFluxo(valor) {
    if (typeof valor !== 'number' || Number.isNaN(valor) || valor < 0) {
      throw new Error('Valor de fluxo invalido.');
    }

    const { data, error } = await supabase
      .from('sensor_readings')
      .insert({ device_id: defaultDeviceId, sensor: 'fluxo_laminar', value: { value: valor }, source: 'editable' })
      .select()
      .single();

    if (error) throw new Error(error.message);
    await espService.enqueueCommand({ deviceId: defaultDeviceId, command: 'SET_FLOW_RATE', payload: { valor } });
    await logger.action('manual', 'Fluxo laminar atualizado.', { valor });
    return data;
  }

  async function saveIluminacao(payload) {
    const { modo, on, intensidade, horario_inicio: horarioInicio, horario_fim: horarioFim } = payload || {};
    if (!['manual', 'automatico'].includes(modo)) throw new Error('Modo de iluminacao invalido.');

    const value = { modo, on: Boolean(on), intensidade: Number(intensidade || 0), horario_inicio: horarioInicio || null, horario_fim: horarioFim || null };

    const { data, error } = await supabase
      .from('sensor_readings')
      .insert({ device_id: defaultDeviceId, sensor: 'iluminacao', value, source: 'editable' })
      .select()
      .single();

    if (error) throw new Error(error.message);
    await espService.enqueueCommand({ deviceId: defaultDeviceId, command: 'SET_LIGHT', payload: value });
    await logger.action('manual', 'Iluminacao atualizada.', value);
    return data;
  }

  return { saveFluxo, saveIluminacao };
}

module.exports = makeManualControlsService;
