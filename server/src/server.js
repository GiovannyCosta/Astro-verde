/**
 * @module server
 * @description Bootstrap do backend com simulacao, bridge ESP e bot Telegram.
 * @hardware esp32/esp8266
 * @mode real
 */

const createApp = require('./app');
const config = require('./config');
const simulator = require('./mocks/sensorSimulator');
const systemState = require('./state/systemState');
const { getSupabase } = require('./integrations/supabase');
const makeEspService = require('./services/espService');
const logger = require('./services/logger');
const { startTelegramBot } = require('./services/telegramBot');

const app = createApp();
simulator.start();
systemState.startSimulation();

const supabase = getSupabase();
let bot = null;
if (supabase) {
  const espService = makeEspService({ supabase, logger });
  bot = startTelegramBot({ supabase, espService, logger });
}

const server = app.listen(config.PORT, () => {
  console.log(`Astro Verde backend online em http://localhost:${config.PORT}`);
});

process.on('SIGINT', () => {
  simulator.stop();
  systemState.stopSimulation();
  if (bot) bot.stopPolling();
  server.close(() => process.exit(0));
});
