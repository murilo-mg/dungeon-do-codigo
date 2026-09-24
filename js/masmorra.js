// Responsável por transformar a lista de funções analisadas
// em salas posicionadas geometricamente ao redor da sala inicial (main).

import { criarGrafo } from './grafoC.js';

const LARGURA_MAPA = 560;
const ALTURA_MAPA = 480;
const CENTRO_X = LARGURA_MAPA / 2;
const CENTRO_Y = ALTURA_MAPA / 2;
const MARGEM_X = 80;
const MARGEM_Y = 70;

export function construirMasmorra(funcoes, grafo = criarGrafo(funcoes)) {
  if (funcoes.length === 0) return [];

  const funcaoPrincipal = grafo.nos.get(grafo.entrada).funcao;
  const posicoes = calcularLayoutHierarquico(
  funcoes,
  funcaoPrincipal,
    grafo.nos
);
  const outrasFuncoes = funcoes.filter(funcao => funcao !== funcaoPrincipal);
const salas = [
  criarSalaInicial(
    funcaoPrincipal,
    grafo.nos.get(funcaoPrincipal.nome),
    posicoes.get(funcaoPrincipal.nome)
  ),
];

outrasFuncoes.forEach(funcao => {
  salas.push(
    criarSalaSecundaria(
      funcao,
      funcaoPrincipal,
      grafo.nos.get(funcao.nome),
      posicoes.get(funcao.nome)
    )
  );
});

  return salas;
}

function calcularLayoutHierarquico(funcoes, funcaoPrincipal, nos) {
  const niveis = new Map();

  funcoes.forEach(funcao => {
    const profundidade = nos.get(funcao.nome).profundidade;
    const chave = profundidade === null ? 'isoladas' : profundidade;

    if (!niveis.has(chave)) {
      niveis.set(chave, []);
    }

    niveis.get(chave).push(funcao);
  });

  const profundidades = [...niveis.keys()]
    .filter(chave => typeof chave === 'number');

  const maiorProfundidade = Math.max(...profundidades, 0);
  const possuiIsoladas = niveis.has('isoladas');

  const quantidadeColunas =
    maiorProfundidade + 1 + (possuiIsoladas ? 1 : 0);

  const posicoes = new Map();

  niveis.forEach((funcoesDoNivel, chave) => {
    const coluna =
      chave === 'isoladas'
        ? quantidadeColunas - 1
        : chave;

    const centroX = calcularCentroDaColuna(
      coluna,
      quantidadeColunas
    );

    funcoesDoNivel.forEach((funcao, indice) => {
      const centroY = calcularCentroVertical(
        indice,
        funcoesDoNivel.length
      );

      const ehInicial = funcao === funcaoPrincipal;
      const largura = ehInicial
        ? 90
        : tamanhoPorComplexidade(funcao.complexidade);

      const altura = ehInicial ? 80 : largura;

      posicoes.set(funcao.nome, {
        x: centroX - largura / 2,
        y: centroY - altura / 2,
      });
    });
  });

  return posicoes;
}

function calcularCentroDaColuna(coluna, quantidadeColunas) {
  if (quantidadeColunas === 1) {
    return CENTRO_X;
  }

  const larguraUtil = LARGURA_MAPA - MARGEM_X * 2;
  const intervalo = larguraUtil / (quantidadeColunas - 1);

  return MARGEM_X + coluna * intervalo;
}

function calcularCentroVertical(indice, quantidade) {
  if (quantidade === 1) {
    return CENTRO_Y;
  }

  const alturaUtil = ALTURA_MAPA - MARGEM_Y * 2;
  const intervalo = alturaUtil / (quantidade - 1);

  return MARGEM_Y + indice * intervalo;
}

function criarSalaInicial(funcaoPrincipal, no, posicao) {
  return {
    ...funcaoPrincipal,
    chamadaPor: no.chamadaPor,
    profundidade: no.profundidade,
    ehSalaInicial: true,
    x: posicao.x,
    y: posicao.y,
    largura: 90,
    altura: 80,
  };
}

function criarSalaSecundaria(
  funcao,
  funcaoPrincipal,
  no,
  posicao
) {
  const tamanho = tamanhoPorComplexidade(funcao.complexidade);

  return {
    ...funcao,
    chamadaPor: no.chamadaPor,
    profundidade: no.profundidade,
    ehSalaInicial: false,
    x: posicao.x,
    y: posicao.y,
    largura: tamanho,
    altura: tamanho,
    ehChamadaPelaPrincipal:
      no.chamadaPor.includes(funcaoPrincipal.nome),
  };
}

export function tamanhoPorComplexidade(complexidade) {
  if (complexidade <= 2) return 60;
  if (complexidade <= 6) return 80;
  return 105;
}

export function corPorSala(sala) {
  if (sala.ehSalaInicial) return '#c9a227';
  if (sala.complexidade <= 2) return '#5a7d3a';
  if (sala.complexidade <= 6) return '#c2601a';
  return '#8f2323';
}
