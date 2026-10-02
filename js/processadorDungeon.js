import { validarCodigoC } from './entradaCodigo.js';
import { ErroPreparacaoDungeon } from './processamentoDungeon.js';

export const PRAZO_PREPARACAO_MS = 8000;

export function criarProcessadorDungeon({
  criarWorker = () => new Worker(new URL('./dungeonWorker.js', import.meta.url), { type: 'module' }),
  prazoMs = PRAZO_PREPARACAO_MS,
} = {}) {
  let cancelarAtual = null;
  return {
    cancelar() { cancelarAtual?.(); },
    executar(codigo) {
      cancelarAtual?.();
      const erro = validarCodigoC(codigo);
      if (erro) return Promise.reject(new ErroPreparacaoDungeon(erro));
      return new Promise((resolve, reject) => {
        let worker;
        let temporizador;
        let concluido = false;
        const finalizar = (resultado, erro) => {
          if (concluido) return;
          concluido = true;
          clearTimeout(temporizador);
          if (worker) {
            worker.onmessage = worker.onerror = worker.onmessageerror = null;
            worker.terminate();
          }
          cancelarAtual = null;
          if (erro) reject(erro);
          else resolve(resultado);
        };
        try {
          worker = criarWorker();
          cancelarAtual = () => finalizar(null, new ErroPreparacaoDungeon('Preparação cancelada.', 'cancelado'));
          worker.onmessage = ({ data }) => {
            if (data?.erro) finalizar(null, new ErroPreparacaoDungeon(data.erro.mensagem, data.erro.tipo));
            else if (data?.resultado) finalizar(data.resultado);
            else finalizar(null, new ErroPreparacaoDungeon('Resposta inválida durante a preparação.', 'interno'));
          };
          worker.onerror = evento => {
            evento.preventDefault?.();
            finalizar(null, new ErroPreparacaoDungeon(
              'Não foi possível iniciar a análise. Use um navegador atualizado e abra o projeto por um servidor HTTP ou HTTPS.', 'interno'));
          };
          worker.onmessageerror = () => finalizar(null, new ErroPreparacaoDungeon(
            'Não foi possível receber o mapa preparado.', 'interno'));
          temporizador = setTimeout(() => finalizar(null, new ErroPreparacaoDungeon(
            'A preparação excedeu 8 segundos e foi interrompida. Experimente um trecho menor.', 'prazo')), prazoMs);
          worker.postMessage(codigo);
        } catch {
          finalizar(null, new ErroPreparacaoDungeon(
            'Este navegador não conseguiu iniciar a análise em segundo plano. Use um navegador atualizado e um servidor HTTP ou HTTPS.', 'interno'));
        }
      });
    },
  };
}
