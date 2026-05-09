/**
 * @module espService
 * @description Ingestao de sensores reais, fila de comandos e deteccao de offline.
 * @hardware esp32/esp8266
 * @mode real
 */

const config = require('../config');

function makeEspService({ supabase, logger }) {
  const validSensors = new Set(['ph', 'boia', 'nivel_reservatorio']);

  function validateData(payload = {}) {
    const { device_id: deviceId, sensor, value, timestamp } = payload;
    if (!deviceId || typeof deviceId !== 'string') throw new Error('device_id obrigatorio.');
    if (!validSensors.has(sensor)) throw new Error('sensor invalido.');
    if (sensor === 'boia' && typeof value !== 'boolean') throw new Error('boia deve ser boolean.');
    if (sensor !== 'boia' && typeof value !== 'number') throw new Error(`${sensor} deve ser number.`);
    if (!timestamp || Number.isNaN(Date.parse(timestamp))) throw new Error('timestamp invalido.');
  }

  async function ingestData(payload) {
    validateData(payload);
    const row = {
      device_id: payload.device_id,
      sensor: payload.sensor,
      value: { value: payload.value, timestamp: payload.timestamp },
      source: 'real',
      created_at: payload.timestamp,
    };

    const { data, error } = await supabase.from('sensor_readings').insert(row).select().single();
    if (error) throw new Error(error.message);

    await logger.info('esp', 'Leitura recebida do ESP.', {
      device_id: payload.device_id,
      sensor: payload.sensor,
      value: payload.value,
    });

    return data;
  }

  async function getPendingCommands(deviceId) {
    const { data, error } = await supabase
      .from('esp_commands')
      .select('*')
      .eq('device_id', deviceId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);
    if (!data.length) return [];

    const ids = data.map((cmd) => cmd.id);
    const { error: updateError } = await supabase
      .from('esp_commands')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .in('id', ids);

    if (updateError) throw new Error(updateError.message);

    await logger.action('esp', 'Comandos enviados para polling do ESP.', { device_id: deviceId, count: data.length });

    return data;
  }

  async function ackCommand({ command_id: commandId, device_id: deviceId }) {
    if (!commandId || !deviceId) throw new Error('command_id e device_id obrigatorios.');

    const { error } = await supabase
      .from('esp_commands')
      .update({ status: 'ack', ack_at: new Date().toISOString() })
      .eq('id', commandId)
      .eq('device_id', deviceId);

    if (error) throw new Error(error.message);

    await logger.action('esp', 'ACK de comando recebido.', { command_id: commandId, device_id: deviceId });
    return { ok: true };
  }

  async function enqueueCommand({ deviceId, command, payload }) {
    const { data, error } = await supabase
      .from('esp_commands')
      .insert({ device_id: deviceId, command, payload, status: 'pending' })
      .select()
      .single();

    if (error) throw new Error(error.message);
    await logger.action('esp', 'Comando enfileirado.', { device_id: deviceId, command, payload });
    return data;
  }

  async function checkOfflineDevices() {
    if (!config.ESP_DEVICE_IDS.length) return [];
    const now = Date.now();
    const offline = [];

    for (const deviceId of config.ESP_DEVICE_IDS) {
      const { data, error } = await supabase
        .from('sensor_readings')
        .select('created_at,sensor,value,device_id')
        .eq('device_id', deviceId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) continue;
      if (!data) {
        offline.push({ device_id: deviceId, offline: true, reason: 'sem leitura' });
        continue;
      }

      const delta = now - new Date(data.created_at).getTime();
      if (delta > config.ESP_OFFLINE_THRESHOLD_MS) {
        offline.push({ device_id: deviceId, offline: true, last_seen: data.created_at, delta_ms: delta });
      }
    }

    for (const entry of offline) {
      await logger.error('esp', 'Device offline detectado.', entry);
    }

    return offline;
  }

  return { ingestData, getPendingCommands, ackCommand, checkOfflineDevices, enqueueCommand };
}

module.exports = makeEspService;
