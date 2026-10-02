import { analisarFuncoes, ErroAnaliseC } from './analisadorC.js';
import { criarGrafo } from './grafoC.js';
import { construirMasmorra } from './masmorra.js';
import { validarCodigoC, validarFuncoes } from './entradaCodigo.js';
import { prepararCenaDungeon } from './preparacaoDungeon.js';

export class ErroPreparacaoDungeon extends Error {
  constructor(mensagem, tipo = 'entrada') {
    super(mensagem);
    this.name = 'ErroPreparacaoDungeon';
    this.tipo = tipo;
  }
}

// Executado no Worker. Sem DOM, rede, compilação ou execução do código C.
export function processarDungeon(codigo) {
  const erroCodigo = validarCodigoC(codigo);
  if (erroCodigo) throw new ErroPreparacaoDungeon(erroCodigo);
  let funcoes;
  try {
    funcoes = analisarFuncoes(codigo);
  } catch (erro) {
    if (!(erro instanceof ErroAnaliseC)) throw erro;
    throw new ErroPreparacaoDungeon(`Não foi possível analisar o código. ${erro.message}`);
  }
  if (!funcoes.length) {
    throw new ErroPreparacaoDungeon(
      'Não consegui encontrar funções nesse código. Confira se está no formato padrão de C.');
  }
  const erroFuncoes = validarFuncoes(funcoes);
  if (erroFuncoes) throw new ErroPreparacaoDungeon(erroFuncoes);
  const grafo = criarGrafo(funcoes);
  const masmorra = construirMasmorra(funcoes, grafo, { layoutRegional: true });
  // Limita também o custo de desenhar o resultado depois que o Worker termina.
  if (masmorra.larguraMundo > 8192 || masmorra.alturaMundo > 8192 ||
      masmorra.larguraMundo * masmorra.alturaMundo > 6000000) {
    throw new ErroPreparacaoDungeon('O mapa ficou grande demais para esta versão. Experimente um trecho menor.');
  }
  masmorra.preparacao = prepararCenaDungeon(masmorra, grafo.arestas);
  if (masmorra.preparacao.segmentosNavegaveis.length > 2048) {
    throw new ErroPreparacaoDungeon('O mapa gerou corredores demais para esta versão. Experimente um trecho menor.');
  }
  return { grafo, masmorra };
}
