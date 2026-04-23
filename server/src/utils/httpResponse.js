/*
 * utils/httpResponse.js - Padrao unico de resposta HTTP da API.
 *
 * Objetivo:
 * - reduzir duplicacao em controllers
 * - manter formato consistente para frontend e integracao futura
 * - facilitar evolucao para logs/telemetria padronizados
 */

/*
 * Envia resposta de sucesso em formato padrao.
 * data: objeto com o conteudo principal retornado pela rota.
 */
function sendSuccess(res, message, data = {}, statusCode = 200) {
  return res.status(statusCode).json({
    status: 'success',
    message,
    data,
  });
}

/* Envia resposta de erro em formato padrao. */
function sendError(res, message, statusCode = 500) {
  return res.status(statusCode).json({
    status: 'error',
    message,
  });
}

module.exports = {
  sendSuccess,
  sendError,
};
