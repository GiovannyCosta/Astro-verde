/*
 * config/index.js — Configurações Centralizadas do Servidor
 *
 * Centralizar configurações aqui evita valores espalhados pelo código.
 * No futuro, essas configurações podem vir de variáveis de ambiente
 * (process.env) para diferentes ambientes: dev, staging, produção.
 */

const config = {

  /* Porta onde o servidor Express vai escutar */
  PORT: process.env.PORT || 3001,

  /* Caminho do banco de dados SQLite */
  DB_PATH: process.env.DB_PATH || './src/database/astroverde.db',

  /* Configurações das faixas ideais (podem ser salvas no banco no futuro) */
  SENSOR_LIMITS: {
    ph:          { min: 5.5, max: 6.5 },
    ec:          { min: 1.2, max: 2.5 },
    temperature: { min: 18, max: 26, critical: 30 },
    luminosity:  { minExpected: 200 },
  },

  /* Intervalo de simulação do sensor (ms) */
  SIMULATOR_INTERVAL_MS: 3000,

  /*
   * CORS: permite que o frontend (aberto no browser)
   * acesse o backend em outra porta (localhost:3001).
   * Em produção, restrinja para o domínio real.
   */
  CORS_ORIGINS: ['http://localhost:5500', 'http://127.0.0.1:5500', '*'],
};

module.exports = config;
