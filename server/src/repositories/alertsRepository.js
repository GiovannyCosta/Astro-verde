/*
 * repositories/alertsRepository.js — Acesso aos Dados de Alertas
 */

function makeAlertsRepository(db) {
  return {

    getActive() {
      return db.findWhere('alerts', a => a.active === true);
    },

    getAll(limit = 100) {
      return db.findAll('alerts', limit);
    },

    upsert(alertType, severity, title, message) {
      const existing = db.findOne('alerts', a => a.alert_type === alertType && a.active === true);
      if (!existing) {
        return db.insert('alerts', { alert_type: alertType, severity, title, message, active: true });
      }
      return existing;
    },

    resolve(alertType) {
      db.updateWhere(
        'alerts',
        a => a.alert_type === alertType && a.active === true,
        { active: false, resolved_at: new Date().toISOString() }
      );
    },
  };
}

module.exports = makeAlertsRepository;
