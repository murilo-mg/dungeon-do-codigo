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
    recursivaDireta: false,
    participaDeCiclo: false,
    callers: ['main', 'a'],
    callees: [],
    caminho: ['main', 'b'],
  });
  assert.deepEqual(obterEstruturaDaFuncao(grafo, 'main').callees, ['a', 'b']);
  assert.equal(obterEstruturaDaFuncao(grafo, 'isolada').profundidade, null);
  assert.equal(obterEstruturaDaFuncao(grafo, 'isolada').caminho, null);
});

function estadoDoCiclo(grafo, nome) {
  const no = grafo.nos.get(nome);
  return { recursivaDireta: no.recursivaDireta, participaDeCiclo: no.participaDeCiclo };
}

test('cadeia e função isolada não participam de ciclo', () => {
  const grafo = criarGrafo([
    criarFuncao('main', ['a']), criarFuncao('a', ['b']), criarFuncao('b'),
    criarFuncao('isolada'),
  ]);
  for (const nome of grafo.nos.keys()) {
    assert.deepEqual(estadoDoCiclo(grafo, nome),
      { recursivaDireta: false, participaDeCiclo: false });
  }
});

test('recursão direta marca também participação em ciclo sem alterar caminho', () => {
  const grafo = criarGrafo([
    criarFuncao('main', ['f']), criarFuncao('f', ['f']),
  ]);
  assert.deepEqual(estadoDoCiclo(grafo, 'f'),
    { recursivaDireta: true, participaDeCiclo: true });
  assert.deepEqual(estadoDoCiclo(grafo, 'main'),
    { recursivaDireta: false, participaDeCiclo: false });
  assert.deepEqual(encontrarCaminhoDaEntrada(grafo, 'f'), ['main', 'f']);
  assert.equal(grafo.nos.get('f').profundidade, 1);
  assert.equal(obterEstruturaDaFuncao(grafo, 'f').recursivaDireta, true);
});

for (const [descricao, funcoes, participantes] of [
  ['duas funções', [criarFuncao('a', ['b']), criarFuncao('b', ['a'])], ['a', 'b']],
  ['três funções', [criarFuncao('a', ['b']), criarFuncao('b', ['c']),
    criarFuncao('c', ['a'])], ['a', 'b', 'c']],
]) {
  test(`ciclo de ${descricao} marca todos os participantes sem recursão direta`, () => {
    const grafo = criarGrafo(funcoes);
    for (const nome of participantes) {
      assert.deepEqual(estadoDoCiclo(grafo, nome),
        { recursivaDireta: false, participaDeCiclo: true });
      assert.equal(obterEstruturaDaFuncao(grafo, nome).participaDeCiclo, true);
    }
  });
}

test('funções que chegam ao ciclo e saem dele não são participantes', () => {
  const grafo = criarGrafo([
    criarFuncao('main', ['a']), criarFuncao('a', ['b']),
    criarFuncao('b', ['c', 'saida']), criarFuncao('c', ['b']),
    criarFuncao('saida'), criarFuncao('isolada'),
  ]);
  for (const nome of ['main', 'a', 'saida', 'isolada']) {
    assert.equal(grafo.nos.get(nome).participaDeCiclo, false);
  }
  for (const nome of ['b', 'c']) {
    assert.equal(grafo.nos.get(nome).participaDeCiclo, true);
  }
  assert.deepEqual(encontrarCaminhoDaEntrada(grafo, 'c'), ['main', 'a', 'b', 'c']);
  assert.equal(grafo.nos.get('c').profundidade, 3);
  assert.deepEqual(obterEstruturaDaFuncao(grafo, 'c').callees, ['b']);
});

test('múltiplos ciclos independentes e arestas externas não geram falsos positivos', () => {
  const grafo = criarGrafo([
    criarFuncao('main', ['a']),
    criarFuncao('a', ['b']), criarFuncao('b', ['a', 'fora']),
    criarFuncao('c', ['d']), criarFuncao('d', ['c']),
    criarFuncao('fora'),
  ]);
  for (const nome of ['a', 'b', 'c', 'd']) {
    assert.equal(grafo.nos.get(nome).participaDeCiclo, true);
  }
  assert.equal(grafo.nos.get('main').participaDeCiclo, false);
  assert.equal(grafo.nos.get('fora').participaDeCiclo, false);
  assert.equal(grafo.nos.get('c').alcancavel, false);
});

test('ciclo longo é detectado sem recursão de chamadas nem mudar a profundidade', () => {
  const tamanho = 200;
  const funcoes = Array.from({ length: tamanho }, (_, indice) => criarFuncao(`f${indice}`,
    [`f${(indice + 1) % tamanho}`]));
  const grafo = criarGrafo([criarFuncao('main', ['f0']), ...funcoes]);
  assert.equal(grafo.nos.get('main').participaDeCiclo, false);
  assert.equal(grafo.nos.get('f199').participaDeCiclo, true);
  assert.equal(grafo.nos.get('f199').recursivaDireta, false);
  assert.equal(grafo.nos.get('f199').profundidade, 200);
  assert.equal(encontrarCaminhoDaEntrada(grafo, 'f199').length, 201);
});
