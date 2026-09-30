import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularContextoTopologico, criarGrafo } from '../js/grafoC.js';
import { calcularLayoutMasmorra } from '../js/layoutMasmorra.js';

function funcao(nome, chamadas = [], complexidade = 0) {
  return { nome, chamadas, complexidade };
}

function relacoes(contexto) {
  return [...contexto.arestas].flatMap(([origem, destinos]) =>
    [...destinos].map(destino => `${origem}->${destino}`));
}

test('cadeia destaca entrada, intermediária, alvo e relações reais', () => {
  const grafo = criarGrafo([
    funcao('main', ['A']), funcao('A', ['B']), funcao('B'),
  ]);
  const contexto = calcularContextoTopologico(grafo, 'B');

  assert.deepEqual([...contexto.funcoes], ['B', 'main', 'A']);
  assert.deepEqual(relacoes(contexto), ['main->A', 'A->B']);
});

test('duas rotas até o mesmo alvo preservam ambas as cadeias', () => {
  const grafo = criarGrafo([
    funcao('main', ['A', 'B']), funcao('A', ['C']),
    funcao('B', ['C']), funcao('C'),
  ]);
  const contexto = calcularContextoTopologico(grafo, 'C');

  assert.deepEqual(new Set(contexto.funcoes), new Set(['main', 'A', 'B', 'C']));
  assert.deepEqual(relacoes(contexto), ['main->A', 'main->B', 'A->C', 'B->C']);
});

test('ramos laterais, callers inalcançáveis e descendentes não entram no foco', () => {
  const grafo = criarGrafo([
    funcao('main', ['A', 'lateral']),
    funcao('A', ['C']), funcao('C', ['depois']),
    funcao('lateral', ['folha']), funcao('folha'),
    funcao('externa', ['C']), funcao('depois'),
  ]);
  const contexto = calcularContextoTopologico(grafo, 'C');

  assert.deepEqual(new Set(contexto.funcoes), new Set(['main', 'A', 'C']));
  assert.deepEqual(relacoes(contexto), ['main->A', 'A->C']);
  assert.equal(grafo.arestas.length, 6);
});

test('função inalcançável destaca somente a própria sala', () => {
  const grafo = criarGrafo([
    funcao('main', ['A']), funcao('A'),
    funcao('isolada', ['outra']), funcao('outra'),
  ]);
  const contexto = calcularContextoTopologico(grafo, 'outra');

  assert.deepEqual([...contexto.funcoes], ['outra']);
  assert.deepEqual(relacoes(contexto), []);
});

test('sem main usa a primeira função do grafo como entrada', () => {
  const grafo = criarGrafo([funcao('inicio', ['fim']), funcao('fim')]);
  const contexto = calcularContextoTopologico(grafo, 'fim');

  assert.deepEqual([...contexto.funcoes], ['fim', 'inicio']);
  assert.deepEqual(relacoes(contexto), ['inicio->fim']);
});

test('ciclos anteriores ao alvo terminam e ciclo após o alvo não vira ancestral', () => {
  const grafo = criarGrafo([
    funcao('main', ['A']), funcao('A', ['B', 'C']),
    funcao('B', ['A']), funcao('C', ['C', 'D']), funcao('D', ['C']),
  ]);
  const contexto = calcularContextoTopologico(grafo, 'C');

  assert.deepEqual(new Set(contexto.funcoes), new Set(['main', 'A', 'B', 'C']));
  assert.deepEqual(relacoes(contexto), ['main->A', 'A->B', 'A->C', 'B->A']);
  assert.deepEqual([...calcularContextoTopologico(grafo, 'main').funcoes], ['main']);
});

test('sem seleção ou com nome inexistente não há contexto visual', () => {
  const grafo = criarGrafo([funcao('main', ['A']), funcao('A')]);

  assert.equal(calcularContextoTopologico(grafo, null), null);
  assert.equal(calcularContextoTopologico(grafo, 'desconhecida'), null);
  assert.equal(calcularContextoTopologico(criarGrafo([]), null), null);
});

test('calcular foco não modifica grafo, profundidades nem geometria das salas', () => {
  const funcoes = [
    funcao('main', ['A', 'B']), funcao('A', ['C'], 4),
    funcao('B', ['C'], 8), funcao('C'), funcao('isolada'),
  ];
  const grafo = criarGrafo(funcoes);
  const grafoAntes = structuredClone(grafo);
  const layoutAntes = calcularLayoutMasmorra(grafo, funcoes);

  calcularContextoTopologico(grafo, 'C');
  calcularContextoTopologico(grafo, 'isolada');

  assert.deepEqual(grafo, grafoAntes);
  assert.deepEqual(calcularLayoutMasmorra(grafo, funcoes), layoutAntes);
});
