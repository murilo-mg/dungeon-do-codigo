// Responsável por transformar a lista de funções analisadas
// em salas posicionadas geometricamente ao redor da sala inicial (main).

import { criarGrafo } from './grafoC.js';
import { calcularLayoutMasmorra } from './layoutMasmorra.js';
import { calcularLayoutRegionalCompleto } from './layoutRegioes.js';
import { criarRegioesMasmorra } from './regioesMasmorra.js';
import { criarCirculacaoDungeon } from './circulacaoDungeon.js';

export { tamanhoPorComplexidade } from './layoutMasmorra.js';

export function construirMasmorra(
  funcoes,
  grafo = criarGrafo(funcoes),
  opcoes = {}
) {
  if (funcoes.length === 0) {
    return {
      salas: [],
      regioes: [],
      larguraMundo: 560,
      alturaMundo: 480,
    };
  }

  const funcaoPrincipal = grafo.nos.get(grafo.entrada).funcao;
  const regioes = criarRegioesMasmorra(grafo);
  const layoutBase = calcularLayoutMasmorra(grafo, funcoes);
  let layout = layoutBase;
  let territoriosRegioes = null;

  if (opcoes.layoutRegional) {
    const salasBase = [...layoutBase.salas].map(
      ([nome, dimensoes]) => ({
        nome,
        ...dimensoes,
      })
    );

    const regional = calcularLayoutRegionalCompleto(
      regioes,
      grafo,
      salasBase
    );

    if (regional.salas.size === funcoes.length) {
      layout = {
        salas: regional.salas,
        larguraMundo: regional.larguraMundo,
        alturaMundo: regional.alturaMundo,
      };

      territoriosRegioes = regional.territorios;
    }
  }

  const outrasFuncoes = funcoes.filter(funcao => funcao !== funcaoPrincipal);
  const salas = [
    criarSalaInicial(
      funcaoPrincipal,
      grafo.nos.get(funcaoPrincipal.nome),
      layout.salas.get(funcaoPrincipal.nome)
    ),
  ];

  outrasFuncoes.forEach(funcao => {
    salas.push(
      criarSalaSecundaria(
        funcao,
        funcaoPrincipal,
        grafo.nos.get(funcao.nome),
        layout.salas.get(funcao.nome)
      )
    );
  });

  return {
    salas,
    regioes,
    ...(territoriosRegioes
      ? { territoriosRegioes, passagensExploracao: criarCirculacaoDungeon(salas, regioes, grafo.arestas) }
      : {}),
    larguraMundo: layout.larguraMundo,
    alturaMundo: layout.alturaMundo,
  };
}

function criarSalaInicial(funcaoPrincipal, no, dimensoes) {
  return {
    ...funcaoPrincipal,
    chamadaPor: no.chamadaPor,
    profundidade: no.profundidade,
    recursivaDireta: no.recursivaDireta,
    participaDeCiclo: no.participaDeCiclo,
    ehSalaInicial: true,
    x: dimensoes.x,
    y: dimensoes.y,
    largura: dimensoes.largura,
    altura: dimensoes.altura,
  };
}

function criarSalaSecundaria(
  funcao,
  funcaoPrincipal,
  no,
  dimensoes
) {
  return {
    ...funcao,
    chamadaPor: no.chamadaPor,
    profundidade: no.profundidade,
    recursivaDireta: no.recursivaDireta,
    participaDeCiclo: no.participaDeCiclo,
    ehSalaInicial: false,
    x: dimensoes.x,
    y: dimensoes.y,
    largura: dimensoes.largura,
    altura: dimensoes.altura,
    ehChamadaPelaPrincipal:
      no.chamadaPor.includes(funcaoPrincipal.nome),
  };
}

export function corPorSala(sala) {
  if (sala.ehSalaInicial) return '#c9a227';
  if (sala.complexidade <= 2) return '#5a7d3a';
  if (sala.complexidade <= 6) return '#c2601a';
  return '#8f2323';
}
