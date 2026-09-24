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
  assert.deepEqual(criarLayout([]), new Map());
});

test('posiciona somente main no centro com seu tamanho', () => {
  const layout = criarLayout([criarFuncao('main')]);
  const main = layout.get('main');

  assert.deepEqual(main, { x: 235, y: 200, largura: 90, altura: 80 });
});

test('distribui duas funções no mesmo nível verticalmente', () => {
  const funcoes = [
    criarFuncao('main', 0, ['a', 'b']),
    criarFuncao('a'),
    criarFuncao('b'),
  ];
  const layout = criarLayout(funcoes);

  assert.equal(layout.get('a').x, layout.get('b').x);
  assert.notEqual(
    layout.get('a').y + layout.get('a').altura / 2,
    layout.get('b').y + layout.get('b').altura / 2
  );
});

test('distribui cadeia em colunas de profundidades diferentes', () => {
  const funcoes = [
    criarFuncao('main', 0, ['a']),
    criarFuncao('a', 0, ['b']),
    criarFuncao('b'),
  ];
  const layout = criarLayout(funcoes);

  assert.ok(layout.get('main').x < layout.get('a').x);
  assert.ok(layout.get('a').x < layout.get('b').x);
});

test('coloca funções isoladas na última coluna', () => {
  const funcoes = [
    criarFuncao('main'),
    criarFuncao('isolada'),
  ];
  const layout = criarLayout(funcoes);

  assert.ok(layout.get('isolada').x > layout.get('main').x);
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

  for (const dimensoes of layout.values()) {
    assert.ok(dimensoes.x >= 0);
    assert.ok(dimensoes.y >= 0);
    assert.ok(dimensoes.x + dimensoes.largura <= 560);
    assert.ok(dimensoes.y + dimensoes.altura <= 480);
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
    const dimensoes = layout.get(nome);
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

  assert.equal(layout.get('baixa').largura, 60);
  assert.equal(layout.get('media').largura, 80);
  assert.equal(layout.get('alta').largura, 105);
});

test('usa a entrada do grafo quando não há main', () => {
  const funcoes = [
    criarFuncao('entrada', 0, ['proxima']),
    criarFuncao('proxima'),
  ];
  const grafo = criarGrafo(funcoes);
  const layout = calcularLayoutMasmorra(grafo, funcoes);

  assert.ok(layout.get('entrada').x < layout.get('proxima').x);
});
