import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarGrafo, encontrarCaminhoDaEntrada, obterEstruturaDaFuncao } from '../js/grafoC.js';

function criarFuncao(nome, chamadas = []) {
  return { nome, chamadas };
}

function nomesDasArestas(grafo) {
  return grafo.arestas.map(aresta => `${aresta.origem}->${aresta.destino}`);
}

test('lista vazia produz um grafo vazio', () => {
  const grafo = criarGrafo([]);

  assert.equal(grafo.entrada, null);
  assert.equal(grafo.nos.size, 0);
  assert.deepEqual(grafo.arestas, []);
});

test('usa main como função de entrada', () => {
  const grafo = criarGrafo([
    criarFuncao('auxiliar'),
    criarFuncao('main'),
  ]);

  assert.equal(grafo.entrada, 'main');
  assert.equal(grafo.nos.get('main').profundidade, 0);
  assert.equal(grafo.nos.get('main').alcancavel, true);
});

test('usa a primeira função quando não há main', () => {
  const grafo = criarGrafo([
    criarFuncao('primeira'),
    criarFuncao('segunda'),
  ]);

  assert.equal(grafo.entrada, 'primeira');
  assert.equal(grafo.nos.get('primeira').profundidade, 0);
  assert.equal(grafo.nos.get('segunda').profundidade, null);
});

test('calcula profundidade em uma cadeia linear', () => {
  const grafo = criarGrafo([
    criarFuncao('main', ['a']),
    criarFuncao('a', ['b']),
    criarFuncao('b'),
  ]);

  assert.deepEqual(nomesDasArestas(grafo), ['main->a', 'a->b']);
  assert.equal(grafo.nos.get('a').profundidade, 1);
  assert.equal(grafo.nos.get('b').profundidade, 2);
  assert.deepEqual(grafo.nos.get('b').chamadaPor, ['a']);
});

test('preserva uma ramificação a partir da entrada', () => {
  const grafo = criarGrafo([
    criarFuncao('main', ['a', 'b']),
    criarFuncao('a'),
    criarFuncao('b'),
  ]);

  assert.deepEqual(nomesDasArestas(grafo), ['main->a', 'main->b']);
  assert.equal(grafo.nos.get('a').profundidade, 1);
  assert.equal(grafo.nos.get('b').profundidade, 1);
});

test('preserva múltiplos callers sem duplicar a relação', () => {
  const grafo = criarGrafo([
    criarFuncao('a', ['c']),
    criarFuncao('b', ['c']),
    criarFuncao('c'),
  ]);

  assert.deepEqual(nomesDasArestas(grafo), ['a->c', 'b->c']);
  assert.deepEqual(grafo.nos.get('c').chamadaPor, ['a', 'b']);
});

test('não duplica aresta quando uma chamada aparece mais de uma vez', () => {
  const grafo = criarGrafo([
    criarFuncao('main', ['a', 'a']),
    criarFuncao('a'),
  ]);

  assert.deepEqual(nomesDasArestas(grafo), ['main->a']);
  assert.deepEqual(grafo.nos.get('a').chamadaPor, ['main']);
});

test('ignora chamadas externas ou inexistentes', () => {
  const grafo = criarGrafo([
    criarFuncao('main', ['printf', 'inexistente']),
  ]);

  assert.deepEqual(grafo.arestas, []);
  assert.deepEqual(grafo.nos.get('main').chamadaPor, []);
});

test('mantém função isolada inalcançável', () => {
  const grafo = criarGrafo([
    criarFuncao('main'),
    criarFuncao('isolada'),
  ]);

  assert.equal(grafo.nos.get('isolada').alcancavel, false);
  assert.equal(grafo.nos.get('isolada').profundidade, null);
});

test('recursão direta não causa loop infinito', () => {
  const grafo = criarGrafo([
    criarFuncao('main', ['f']),
    criarFuncao('f', ['f']),
  ]);

  assert.deepEqual(nomesDasArestas(grafo), ['main->f', 'f->f']);
  assert.equal(grafo.nos.get('f').profundidade, 1);
  assert.equal(grafo.nos.get('f').alcancavel, true);
});

test('ciclo entre funções não causa loop infinito', () => {
  const grafo = criarGrafo([
    criarFuncao('main', ['a']),
    criarFuncao('a', ['b']),
    criarFuncao('b', ['a']),
  ]);

  assert.deepEqual(nomesDasArestas(grafo), ['main->a', 'a->b', 'b->a']);
  assert.equal(grafo.nos.get('a').profundidade, 1);
  assert.equal(grafo.nos.get('b').profundidade, 2);
});

test('usa a menor profundidade entre caminhos possíveis', () => {
  const grafo = criarGrafo([
    criarFuncao('main', ['longo', 'curto']),
    criarFuncao('longo', ['meio']),
    criarFuncao('curto', ['meio']),
    criarFuncao('meio'),
  ]);

  assert.equal(grafo.nos.get('meio').profundidade, 2);
});

test('caminho da entrada para ela mesma, inclusive com recursão direta', () => {
  const grafo = criarGrafo([criarFuncao('main', ['main'])]);
  assert.deepEqual(encontrarCaminhoDaEntrada(grafo, 'main'), ['main']);
});

test('caminho segue uma cadeia e coincide com a profundidade', () => {
  const grafo = criarGrafo([
    criarFuncao('main', ['a']), criarFuncao('a', ['b']), criarFuncao('b'),
  ]);
  const caminho = encontrarCaminhoDaEntrada(grafo, 'b');
  assert.deepEqual(caminho, ['main', 'a', 'b']);
  assert.equal(caminho.length - 1, grafo.nos.get('b').profundidade);
});

test('ramificação escolhe cada destino sem criar ligação entre irmãos', () => {
  const grafo = criarGrafo([
    criarFuncao('main', ['a', 'b']), criarFuncao('a'), criarFuncao('b'),
  ]);
  assert.deepEqual(encontrarCaminhoDaEntrada(grafo, 'a'), ['main', 'a']);
  assert.deepEqual(encontrarCaminhoDaEntrada(grafo, 'b'), ['main', 'b']);
});

test('múltiplos caminhos mínimos seguem a ordem estrutural das chamadas', () => {
  const grafo = criarGrafo([
    criarFuncao('main', ['b', 'a']), criarFuncao('a', ['fim']),
    criarFuncao('b', ['fim']), criarFuncao('fim'),
  ]);
  assert.deepEqual(encontrarCaminhoDaEntrada(grafo, 'fim'), ['main', 'b', 'fim']);
  assert.deepEqual(encontrarCaminhoDaEntrada(grafo, 'fim'), ['main', 'b', 'fim']);
});

test('prefere caminho direto a cadeia mais longa', () => {
  const grafo = criarGrafo([
    criarFuncao('main', ['a', 'fim']), criarFuncao('a', ['fim']), criarFuncao('fim'),
  ]);
  assert.deepEqual(encontrarCaminhoDaEntrada(grafo, 'fim'), ['main', 'fim']);
});

test('função isolada e destino inexistente não têm caminho', () => {
  const grafo = criarGrafo([criarFuncao('main'), criarFuncao('isolada')]);
  assert.equal(encontrarCaminhoDaEntrada(grafo, 'isolada'), null);
  assert.equal(encontrarCaminhoDaEntrada(grafo, 'inexistente'), null);
  assert.equal(obterEstruturaDaFuncao(grafo, 'inexistente'), null);
});

test('ciclo e recursão não repetem nós no caminho', () => {
  const grafo = criarGrafo([
    criarFuncao('main', ['a']), criarFuncao('a', ['a', 'b']),
    criarFuncao('b', ['a']),
  ]);
  assert.deepEqual(encontrarCaminhoDaEntrada(grafo, 'b'), ['main', 'a', 'b']);
});

test('grafo vazio não tem caminho', () => {
  assert.equal(encontrarCaminhoDaEntrada(criarGrafo([]), 'main'), null);
});

test('sem main usa a primeira função como entrada', () => {
  const grafo = criarGrafo([criarFuncao('inicio', ['fim']), criarFuncao('fim')]);
  assert.deepEqual(encontrarCaminhoDaEntrada(grafo, 'fim'), ['inicio', 'fim']);
});

test('resumo estrutural usa chamadas recebidas e arestas conhecidas', () => {
  const grafo = criarGrafo([
    criarFuncao('main', ['a', 'b', 'printf']), criarFuncao('a', ['b']),
    criarFuncao('b'), criarFuncao('isolada'),
  ]);
  assert.deepEqual(obterEstruturaDaFuncao(grafo, 'b'), {
    profundidade: 1,
    ehEntrada: false,
    callers: ['main', 'a'],
    callees: [],
    caminho: ['main', 'b'],
  });
  assert.deepEqual(obterEstruturaDaFuncao(grafo, 'main').callees, ['a', 'b']);
  assert.equal(obterEstruturaDaFuncao(grafo, 'isolada').profundidade, null);
  assert.equal(obterEstruturaDaFuncao(grafo, 'isolada').caminho, null);
});
