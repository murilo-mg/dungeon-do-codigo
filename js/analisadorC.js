// Responsável por extrair funções de um código-fonte em C
// e calcular métricas simples de complexidade de cada uma.

const PALAVRAS_RESERVADAS = ['if', 'for', 'while', 'switch', 'return', 'sizeof'];
const EXPRESSAO_FUNCAO = /(?:^|\n)\s*[\w\*\s]+?\b(\w+)\s*\(([^;{)]*)\)\s*\{/g;
const EXPRESSAO_ESTRUTURAS_CONTROLE = /\b(if|for|while|switch|case)\b/g;

export function analisarFuncoes(codigoFonte) {
  const codigoLimpo = removerComentarios(codigoFonte);
  const funcoes = [];
  let correspondencia;

  EXPRESSAO_FUNCAO.lastIndex = 0;
  while ((correspondencia = EXPRESSAO_FUNCAO.exec(codigoLimpo)) !== null) {
    const nome = correspondencia[1];
    if (PALAVRAS_RESERVADAS.includes(nome)) continue;

    const posicaoChaveAbertura = correspondencia.index + correspondencia[0].length - 1;
    const posicaoFechamento = encontrarFechamentoDoCorpo(codigoLimpo, posicaoChaveAbertura);
    const corpo = codigoLimpo.slice(posicaoChaveAbertura + 1, posicaoFechamento - 1);
    const textoCompleto = codigoLimpo.slice(correspondencia.index, posicaoFechamento).trim();

    funcoes.push(construirDescritorDeFuncao(nome, corpo, textoCompleto));
  }

  return funcoes;
}

function removerComentarios(codigoFonte) {
  return codigoFonte
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');
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

function construirDescritorDeFuncao(nome, corpo, textoCompleto) {
  const estruturasControle = (corpo.match(EXPRESSAO_ESTRUTURAS_CONTROLE) || []).length;
  const linhas = corpo.split('\n').filter(linha => linha.trim().length > 0).length;
  const complexidade = estruturasControle * 2 + Math.floor(linhas / 4);

  return { nome, corpo, textoCompleto, linhas, estruturasControle, complexidade };
}