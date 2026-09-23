// Responsável por extrair funções de um código-fonte em C
// e calcular métricas simples de complexidade de cada uma.

import { prepararCodigoParaAnalise } from './lexicoC.js';
export { ErroAnaliseC } from './lexicoC.js';

const PALAVRAS_RESERVADAS = ['if', 'for', 'while', 'switch', 'return', 'sizeof'];
const EXPRESSAO_FUNCAO = /(?:^|\n)\s*[\w\*\s]+?\b(\w+)\s*\(([^;{)]*)\)\s*\{/g;
const EXPRESSAO_ESTRUTURAS_CONTROLE = /\b(if|for|while|switch|case)\b/g;

export function analisarFuncoes(codigoFonte) {
  const { estrutura, semComentarios } = prepararCodigoParaAnalise(codigoFonte);
  const funcoes = [];
  let correspondencia;

  EXPRESSAO_FUNCAO.lastIndex = 0;
  while ((correspondencia = EXPRESSAO_FUNCAO.exec(estrutura)) !== null) {
    const nome = correspondencia[1];
    if (PALAVRAS_RESERVADAS.includes(nome)) continue;

    const posicaoChaveAbertura = correspondencia.index + correspondencia[0].length - 1;
    const posicaoFechamento = encontrarFechamentoDoCorpo(estrutura, posicaoChaveAbertura);
    const inicioDeclaracao = correspondencia.index + correspondencia[0].search(/\S/);
    const corpo = semComentarios.slice(posicaoChaveAbertura + 1, posicaoFechamento - 1);
    const textoCompleto = codigoFonte.slice(inicioDeclaracao, posicaoFechamento);
    const corpoEstrutural = estrutura.slice(posicaoChaveAbertura + 1, posicaoFechamento - 1);

    funcoes.push(construirDescritorDeFuncao(nome, corpo, textoCompleto, corpoEstrutural));
    // O corpo já foi consumido; não confundir seus blocos com outras funções.
    EXPRESSAO_FUNCAO.lastIndex = posicaoFechamento;
  }
  adicionarChamadasEntreFuncoes(funcoes);

  return funcoes;
}

function adicionarChamadasEntreFuncoes(funcoes) {
  const nomesConhecidos = new Set(funcoes.map(funcao => funcao.nome));

  funcoes.forEach(funcao => {
    funcao.chamadas = encontrarChamadas(funcao.corpoEstrutural, nomesConhecidos);
    delete funcao.corpoEstrutural;
  });
}

function encontrarChamadas(corpoEstrutural, nomesConhecidos) {
  const chamadas = [];
  const expressaoChamada = /\b([A-Za-z_]\w*)\s*\(/g;
  let correspondencia;

  while ((correspondencia = expressaoChamada.exec(corpoEstrutural)) !== null) {
    const nome = correspondencia[1];

    if (nomesConhecidos.has(nome) && !chamadas.includes(nome)) {
      chamadas.push(nome);
    }
  }

  return chamadas;
}

function encontrarFechamentoDoCorpo(codigo, posicaoChaveAbertura) {
  let profundidade = 1;
  let indice = posicaoChaveAbertura + 1;

  while (indice < codigo.length && profundidade > 0) {
    if (codigo[indice] === '{') profundidade++;
    else if (codigo[indice] === '}') profundidade--;
    indice++;
  }

  return indice;
}

function construirDescritorDeFuncao(nome, corpo, textoCompleto, corpoEstrutural) {
  const estruturasControle = (corpoEstrutural.match(EXPRESSAO_ESTRUTURAS_CONTROLE) || []).length;
  const linhas = corpo.split('\n').filter(linha => linha.trim().length > 0).length;
  const complexidade = estruturasControle * 2 + Math.floor(linhas / 4);

  return {
  nome,
  corpo,
  textoCompleto,
  linhas,
  estruturasControle,
  complexidade,
  corpoEstrutural,
};
}
