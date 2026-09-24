import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarGrafo } from '../js/grafoC.js';
import { calcularLayoutMasmorra } from '../js/layoutMasmorra.js';

function criarFuncao(nome, complexidade = 0, chamadas = []) {
  return { nome, complexidade, chamadas };
}

function criarLayout(funcoes) {
  return calcularLayoutMasmorra(criarGrafo(funcoes), funcoes);
}

test('grafo vazio produz layout vazio', () => {
  assert.deepEqual(criarLayout([]), {
    salas: new Map(),
    larguraMundo: 560,
    alturaMundo: 480,
  });
});

test('posiciona somente main no centro com seu tamanho', () => {
  const layout = criarLayout([criarFuncao('main')]);
  const main = layout.salas.get('main');

  assert.deepEqual(main, { x: 235, y: 200, largura: 90, altura: 80 });
  assert.equal(layout.larguraMundo, 560);
  assert.equal(layout.alturaMundo, 480);
});

test('distribui duas funções no mesmo nível verticalmente', () => {
  const funcoes = [
    criarFuncao('main', 0, ['a', 'b']),
    criarFuncao('a'),
    criarFuncao('b'),
  ];
  const layout = criarLayout(funcoes);

  assert.equal(layout.salas.get('a').x, layout.salas.get('b').x);
  assert.notEqual(
    layout.salas.get('a').y + layout.salas.get('a').altura / 2,
    layout.salas.get('b').y + layout.salas.get('b').altura / 2
  );
});

test('distribui cadeia em colunas de profundidades diferentes', () => {
  const funcoes = [
    criarFuncao('main', 0, ['a']),
    criarFuncao('a', 0, ['b']),
    criarFuncao('b'),
  ];
  const layout = criarLayout(funcoes);

  assert.ok(layout.salas.get('main').x < layout.salas.get('a').x);
  assert.ok(layout.salas.get('a').x < layout.salas.get('b').x);
});

test('coloca funções isoladas na última coluna', () => {
  const funcoes = [
    criarFuncao('main'),
    criarFuncao('isolada'),
  ];
  const layout = criarLayout(funcoes);

  assert.ok(layout.salas.get('isolada').x > layout.salas.get('main').x);
});

test('a mesma entrada produz exatamente o mesmo layout', () => {
  const funcoes = [
    criarFuncao('main', 0, ['a', 'b']),
    criarFuncao('a', 4),
    criarFuncao('b', 8),
  ];

  assert.deepEqual(criarLayout(funcoes), criarLayout(funcoes));
});

test('mantém posições dentro dos limites previstos do canvas lógico', () => {
  const funcoes = [
    criarFuncao('main', 0, ['a', 'b']),
    criarFuncao('a'),
    criarFuncao('b'),
  ];
  const layout = criarLayout(funcoes);

  for (const dimensoes of layout.salas.values()) {
    assert.ok(dimensoes.x >= 0);
    assert.ok(dimensoes.y >= 0);
    assert.ok(dimensoes.x + dimensoes.largura <= layout.larguraMundo);
    assert.ok(dimensoes.y + dimensoes.altura <= layout.alturaMundo);
  }
});

test('funções no mesmo nível não ocupam o mesmo centro', () => {
  const funcoes = [
    criarFuncao('main', 0, ['a', 'b']),
    criarFuncao('a'),
    criarFuncao('b'),
  ];
  const layout = criarLayout(funcoes);
  const centros = ['a', 'b'].map(nome => {
    const dimensoes = layout.salas.get(nome);
    return dimensoes.y + dimensoes.altura / 2;
  });

  assert.notEqual(centros[0], centros[1]);
});

test('respeita tamanhos diferentes conforme a complexidade', () => {
  const funcoes = [
    criarFuncao('main', 0, ['baixa', 'media', 'alta']),
    criarFuncao('baixa', 0),
    criarFuncao('media', 4),
    criarFuncao('alta', 8),
  ];
  const layout = criarLayout(funcoes);

  assert.equal(layout.salas.get('baixa').largura, 60);
  assert.equal(layout.salas.get('media').largura, 80);
  assert.equal(layout.salas.get('alta').largura, 105);
});

test('respeita o gap vertical considerando as alturas reais', () => {
  const funcoes = [
    criarFuncao('main', 0, ['baixa', 'media', 'alta']),
    criarFuncao('baixa', 0),
    criarFuncao('media', 4),
    criarFuncao('alta', 8),
  ];
  const layout = criarLayout(funcoes);
  const salas = ['baixa', 'media', 'alta']
    .map(nome => layout.salas.get(nome))
    .sort((a, b) => a.y - b.y);

  for (let indice = 1; indice < salas.length; indice++) {
    const gap = salas[indice].y -
      (salas[indice - 1].y + salas[indice - 1].altura);
    assert.ok(gap >= 20);
  }
});

test('usa a entrada do grafo quando não há main', () => {
  const funcoes = [
    criarFuncao('entrada', 0, ['proxima']),
    criarFuncao('proxima'),
  ];
  const grafo = criarGrafo(funcoes);
  const layout = calcularLayoutMasmorra(grafo, funcoes);

  assert.ok(layout.salas.get('entrada').x < layout.salas.get('proxima').x);
});
