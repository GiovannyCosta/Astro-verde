/**
 * @module telegramBot
 * @description Bot Telegram para status, comandos editaveis e logs/alertas com logger.
 * @hardware esp32/esp8266
 * @mode real
 */

const config = require('../config');

function startTelegramBot({ supabase, espService, logger }) {
  if (!config.TELEGRAM_BOT_TOKEN) return null;

  let TelegramBot;
  try {
    TelegramBot = require('node-telegram-bot-api');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('[telegram] dependencia node-telegram-bot-api nao instalada.');
    return null;
  }

  const bot = new TelegramBot(config.TELEGRAM_BOT_TOKEN, { polling: true });

  bot.onText(/\/status_esp/, async (msg) => {
    const chatId = msg.chat.id;
    const lines = [];

    for (const deviceId of config.ESP_DEVICE_IDS) {
      const { data } = await supabase
        .from('sensor_readings')
        .select('*')
        .eq('device_id', deviceId)
        .order('created_at', { ascending: false })
        .limit(1);
      const last = data?.[0];
      if (!last) {
        lines.push(`${deviceId}: OFFLINE sem leitura`);
        continue;
      }
      const deltaMs = Date.now() - new Date(last.created_at).getTime();
      const online = deltaMs <= config.ESP_OFFLINE_THRESHOLD_MS ? 'ONLINE' : 'OFFLINE';
      lines.push(`${deviceId}: ${online} | ${last.sensor}=${JSON.stringify(last.value)} | ${last.created_at}`);
    }

    await bot.sendMessage(chatId, lines.join('\n') || 'Nenhum device cadastrado.');
    await logger.action('telegram', '/status_esp executado.', { chat_id: chatId });
  });

  bot.onText(/\/set_fluxo (.+)/, async (msg, match) => {
    const valor = Number(match[1]);
    const deviceId = config.ESP_DEVICE_IDS[0] || 'astro-verde-esp';
    await supabase.from('sensor_readings').insert({ device_id: deviceId, sensor: 'fluxo_laminar', value: { value: valor }, source: 'editable' });
    await espService.enqueueCommand({ deviceId, command: 'SET_FLOW_RATE', payload: { valor } });
    await bot.sendMessage(msg.chat.id, `Fluxo atualizado para ${valor} L/h.`);
    await logger.action('telegram', '/set_fluxo executado.', { valor, chat_id: msg.chat.id });
  });

  bot.onText(/\/set_luz (on|off|auto)/, async (msg, match) => {
    const mode = match[1];
    const deviceId = config.ESP_DEVICE_IDS[0] || 'astro-verde-esp';
    await supabase.from('sensor_readings').insert({ device_id: deviceId, sensor: 'iluminacao', value: { mode }, source: 'editable' });
    await espService.enqueueCommand({ deviceId, command: 'SET_LIGHT', payload: { mode } });
    await bot.sendMessage(msg.chat.id, `Iluminacao atualizada para ${mode}.`);
    await logger.action('telegram', '/set_luz executado.', { mode, chat_id: msg.chat.id });
  });

  bot.onText(/\/logs\s*(\d+)?/, async (msg, match) => {
    const limit = Number(match?.[1] || 10);
    const { data } = await supabase.from('system_logs').select('*').order('created_at', { ascending: false }).limit(limit);
    const text = (data || []).map((row) => `[${row.level}] [${row.category}] ${row.message}`).join('\n') || 'Sem logs.';
    await bot.sendMessage(msg.chat.id, text);
    await logger.action('telegram', '/logs executado.', { limit, chat_id: msg.chat.id });
  });

  bot.onText(/\/alertas/, async (msg) => {
    const { data } = await supabase.from('system_logs').select('*').eq('level', 'error').order('created_at', { ascending: false }).limit(20);
    const text = (data || []).map((row) => `[${row.created_at}] ${row.message}`).join('\n') || 'Sem alertas ativos.';
    await bot.sendMessage(msg.chat.id, text);
    await logger.action('telegram', '/alertas executado.', { chat_id: msg.chat.id });
  });

  return bot;
}

module.exports = { startTelegramBot };
