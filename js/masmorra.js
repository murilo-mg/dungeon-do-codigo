// Responsável por transformar a lista de funções analisadas
// em salas posicionadas geometricamente ao redor da sala inicial (main).

import { criarGrafo } from './grafoC.js';
import { calcularLayoutMasmorra } from './layoutMasmorra.js';

export { tamanhoPorComplexidade } from './layoutMasmorra.js';

export function construirMasmorra(funcoes, grafo = criarGrafo(funcoes)) {
  if (funcoes.length === 0) return [];

  const funcaoPrincipal = grafo.nos.get(grafo.entrada).funcao;
  const layout = calcularLayoutMasmorra(grafo, funcoes);
  const outrasFuncoes = funcoes.filter(funcao => funcao !== funcaoPrincipal);
  const salas = [
    criarSalaInicial(
      funcaoPrincipal,
      grafo.nos.get(funcaoPrincipal.nome),
      layout.get(funcaoPrincipal.nome)
    ),
  ];

  outrasFuncoes.forEach(funcao => {
    salas.push(
      criarSalaSecundaria(
        funcao,
        funcaoPrincipal,
        grafo.nos.get(funcao.nome),
        layout.get(funcao.nome)
      )
    );
  });

  return salas;
}

function criarSalaInicial(funcaoPrincipal, no, dimensoes) {
  return {
    ...funcaoPrincipal,
    chamadaPor: no.chamadaPor,
    profundidade: no.profundidade,
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
