// Calcula somente a geometria das salas a partir do grafo e das funções.

const LARGURA_MAPA = 560;
const ALTURA_MAPA = 480;
const CENTRO_X = LARGURA_MAPA / 2;
const CENTRO_Y = ALTURA_MAPA / 2;
const MARGEM_X = 80;
const MARGEM_Y = 70;

export function calcularLayoutMasmorra(grafo, funcoes) {
  if (funcoes.length === 0) return new Map();

  const funcaoPrincipal = grafo.nos.get(grafo.entrada).funcao;
  const niveis = agruparPorProfundidade(grafo, funcoes);
  const profundidades = [...niveis.keys()]
    .filter(chave => typeof chave === 'number');
  const maiorProfundidade = Math.max(...profundidades, 0);
  const possuiIsoladas = niveis.has('isoladas');
  const quantidadeColunas =
    maiorProfundidade + 1 + (possuiIsoladas ? 1 : 0);
  const layout = new Map();

  niveis.forEach((funcoesDoNivel, chave) => {
    const coluna = chave === 'isoladas'
      ? quantidadeColunas - 1
      : chave;
    const centroX = calcularCentroDaColuna(coluna, quantidadeColunas);

    funcoesDoNivel.forEach((funcao, indice) => {
      const centroY = calcularCentroVertical(
        indice,
        funcoesDoNivel.length
      );
      const dimensoes = dimensoesDaFuncao(funcao, funcao === funcaoPrincipal);

      layout.set(funcao.nome, {
        x: centroX - dimensoes.largura / 2,
        y: centroY - dimensoes.altura / 2,
        ...dimensoes,
      });
    });
  });

  return layout;
}

function agruparPorProfundidade(grafo, funcoes) {
  const niveis = new Map();

  funcoes.forEach(funcao => {
    const profundidade = grafo.nos.get(funcao.nome).profundidade;
    const chave = profundidade === null ? 'isoladas' : profundidade;

    if (!niveis.has(chave)) niveis.set(chave, []);
    niveis.get(chave).push(funcao);
  });

  return niveis;
}

function dimensoesDaFuncao(funcao, ehInicial) {
  const tamanho = ehInicial ? 90 : tamanhoPorComplexidade(funcao.complexidade);
  return {
    largura: tamanho,
    altura: ehInicial ? 80 : tamanho,
  };
}

function calcularCentroDaColuna(coluna, quantidadeColunas) {
  if (quantidadeColunas === 1) return CENTRO_X;

  const larguraUtil = LARGURA_MAPA - MARGEM_X * 2;
  const intervalo = larguraUtil / (quantidadeColunas - 1);
  return MARGEM_X + coluna * intervalo;
}

function calcularCentroVertical(indice, quantidade) {
  if (quantidade === 1) return CENTRO_Y;

  const alturaUtil = ALTURA_MAPA - MARGEM_Y * 2;
  const intervalo = alturaUtil / (quantidade - 1);
  return MARGEM_Y + indice * intervalo;
}

export function tamanhoPorComplexidade(complexidade) {
  if (complexidade <= 2) return 60;
  if (complexidade <= 6) return 80;
  return 105;
}
