/*
 * repositories/logsRepository.js — Acesso ao Log do Sistema
 */

function makeLogsRepository(db) {
  return {

    getRecent(limit = 50) {
      return db.findAll('system_logs', limit);
    },

    insert(logType, title, message) {
      return db.insert('system_logs', { log_type: logType, title, message });
    },
  };
}

module.exports = makeLogsRepository;
