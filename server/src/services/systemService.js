/*
 * services/systemService.js - Regras de negocio do estado global do sistema.
 *
 * Esta camada concentra:
 * - recebimento de pH para modo real/simulado
 * - controle manual da bomba
 * - troca de modo de operacao
 * - leitura do estado central
 *
 * Assim, controllers ficam responsaveis apenas por HTTP.
 */

function makeSystemService(systemState) {
  return {
    /*
     * Processa leitura de pH recebida da API.
     * body esperado:
     * - ph: number
     * - deviceId: string (opcional)
     */
    receivePh(body = {}) {
      const { ph, deviceId = null } = body;
      const reading = systemState.ingestPhReading(ph);
      const snapshot = systemState.getStateSnapshot();

      return {
        deviceId,
        ph: reading.phUsado,
        bomba: snapshot.bombaLigada,
        modo: snapshot.modoAtual,
        origemLeitura: snapshot.origemLeitura,
        ultimaAtualizacao: snapshot.ultimaAtualizacao,
      };
    },

    /* Retorna estado atual pronto para dashboard e camada fisica. */
    getState() {
      const snapshot = systemState.getStateSnapshot();
      return {
        ph: snapshot.phAtual,
        bomba: snapshot.bombaLigada,
        modo: snapshot.modoAtual,
        ultimaAtualizacao: snapshot.ultimaAtualizacao,
        origemLeitura: snapshot.origemLeitura,
      };
    },

    /*
     * Atualiza controle manual da bomba.
     * body esperado:
     * - ligar: boolean
     */
    setPump(body = {}) {
      const { ligar } = body;
      const bomba = systemState.setBombaLigada(ligar);

      return {
        bomba,
        ultimaAtualizacao: systemState.getUltimaAtualizacao(),
      };
    },

    /*
     * Atualiza modo do sistema.
     * body esperado:
     * - modo: "simulado" | "real"
     */
    setMode(body = {}) {
      const { modo } = body;
      const modoAtual = systemState.setModoAtual(modo);

      return {
        modo: modoAtual,
        ultimaAtualizacao: systemState.getUltimaAtualizacao(),
      };
    },

    /* Health-check simples para monitoramento da API. */
    getHealth() {
      return { status: 'ok' };
    },
  };
}

module.exports = makeSystemService;
