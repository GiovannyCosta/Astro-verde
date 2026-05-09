/**
 * @module supabase
 * @description Cliente Supabase compartilhado para escrita/leitura e realtime.
 * @hardware esp32/esp8266
 * @mode real
 */

const { createClient } = require('@supabase/supabase-js');
const config = require('../config');

let supabase = null;

function getSupabase() {
  if (supabase) return supabase;
  if (!config.SUPABASE_URL || !config.SUPABASE_SERVICE_ROLE_KEY) return null;

  supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return supabase;
}

module.exports = { getSupabase };
