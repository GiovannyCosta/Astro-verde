/**
 * @module logger
 * @description Logger operacional persistido em system_logs no Supabase.
 * @hardware esp32/esp8266
 * @mode real
 */

const { getSupabase } = require('../integrations/supabase');

async function write(level, category, message, metadata = null) {
  const payload = { level, category, message, metadata };
  const supabase = getSupabase();

  if (!supabase) {
    const base = `[${level.toUpperCase()}] [${category}] ${message}`;
    // eslint-disable-next-line no-console
    console.log(base, metadata || '');
    return payload;
  }

  const { error } = await supabase.from('system_logs').insert(payload);
  if (error) {
    // eslint-disable-next-line no-console
    console.error('[logger] falha ao salvar no Supabase:', error.message);
  }

  return payload;
}

const logger = {
  info: (category, message, metadata) => write('info', category, message, metadata),
  warn: (category, message, metadata) => write('warn', category, message, metadata),
  error: (category, message, metadata) => write('error', category, message, metadata),
  action: (category, message, metadata) => write('action', category, message, metadata),
};

module.exports = logger;
