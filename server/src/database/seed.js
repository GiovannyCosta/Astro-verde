/*
 * database/seed.js — Re-exporta o initDatabase do jsonDb
 *
 * Mantemos este arquivo para compatibilidade com os imports
 * existentes em app.js e sensorSimulator.js.
 */

const { initDatabase } = require('./jsonDb');
module.exports = { initDatabase };
