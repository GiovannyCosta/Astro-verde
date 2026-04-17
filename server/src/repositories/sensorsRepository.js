/*
 * repositories/sensorsRepository.js — Acesso aos Dados de Sensores
 *
 * Usa o jsonDb como armazenamento (sem SQLite nativo).
 * A interface pública permanece igual — trocar para PostgreSQL
 * só exige mudar este arquivo.
 */

function makeSensorsRepository(db) {
  return {

    /* Retorna as N leituras mais recentes */
    getLatest(limit = 1) {
      return db.findAll('readings', limit);
    },

    /* Retorna leituras de um tipo num intervalo de horas */
    getByType(sensorType, hours = 24) {
      const since = new Date(Date.now() - hours * 3600 * 1000).toISOString();
      return db.findWhere('readings', r =>
        r.sensor_type === sensorType && r.created_at >= since
      ).slice(-200); // limita para não crescer demais
    },

    /* Insere nova leitura */
    insert(reading) {
      return db.insert('readings', reading);
    },

    /* Retorna leituras das últimas 24h para exportação */
    exportCsv(hours = 24) {
      const since = new Date(Date.now() - hours * 3600 * 1000).toISOString();
      return db.findWhere('readings', r => r.created_at >= since);
    },
  };
}

module.exports = makeSensorsRepository;
