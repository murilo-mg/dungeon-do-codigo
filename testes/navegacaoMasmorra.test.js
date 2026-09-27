import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarSegmentosDeCorredores } from '../js/corredores.js';
import { calcularRotaCaminhavel } from '../js/navegacaoMasmorra.js';

const salas = [
  { nome: 'main', x: 60, y: 60, largura: 80, altura: 80 },
  { nome: 'A', x: 170, y: 70, largura: 60, altura: 60 },
  { nome: 'B', x: 170, y: 170, largura: 60, altura: 60 },
  { nome: 'isolada', x: 370, y: 70, largura: 60, altura: 60 },
];
const segmentos = criarSegmentosDeCorredores(salas, [
  { origem: 'main', destino: 'A' }, { origem: 'A', destino: 'B' },
]);

test('rota segue centros de salas e corredores reais sem cortar caminho', () => {
  assert.deepEqual(calcularRotaCaminhavel(salas, segmentos, { x: 100, y: 100 }, 'B'), [
    { x: 100, y: 100 }, { x: 200, y: 100 }, { x: 200, y: 200 },
  ]);
  assert.deepEqual(calcularRotaCaminhavel(salas, segmentos, { x: 200, y: 200 }, 'main'), [
    { x: 200, y: 200 }, { x: 200, y: 100 }, { x: 100, y: 100 },
  ]);
});

test('partida sobre corredor segue a faixa existente até uma sala conectada', () => {
  assert.deepEqual(calcularRotaCaminhavel(salas, segmentos, { x: 150, y: 103 }, 'B'), [
    { x: 150, y: 100 }, { x: 200, y: 100 }, { x: 200, y: 200 },
  ]);
});

test('fora da faixa e destino desconectado não produzem caminho artificial', () => {
  assert.equal(calcularRotaCaminhavel(salas, segmentos, { x: 150, y: 120 }, 'B'), null);
  assert.equal(calcularRotaCaminhavel(salas, segmentos, { x: 100, y: 100 }, 'isolada'), null);
  assert.equal(calcularRotaCaminhavel(salas, segmentos, { x: 100, y: 100 }, 'ausente'), null);
});

test('cruzamento geométrico sem sala não vira passagem e não modifica dados', () => {
  const salasCruzadas = [
    { nome: 'a', x: 70, y: 70, largura: 60, altura: 60 },
    { nome: 'b', x: 270, y: 270, largura: 60, altura: 60 },
    { nome: 'c', x: 70, y: 270, largura: 60, altura: 60 },
    { nome: 'd', x: 270, y: 70, largura: 60, altura: 60 },
  ];
  const corredores = criarSegmentosDeCorredores(salasCruzadas, [
    { origem: 'a', destino: 'b' }, { origem: 'c', destino: 'd' },
  ]);
  const salasAntes = structuredClone(salasCruzadas);
  const corredoresAntes = structuredClone(corredores);

  assert.equal(calcularRotaCaminhavel(salasCruzadas, corredores, { x: 100, y: 100 }, 'd'),
    null);
  assert.deepEqual(salasCruzadas, salasAntes);
  assert.deepEqual(corredores, corredoresAntes);
});

test('ciclos e chamadas em sentidos opostos terminam sem alterar o grafo físico', () => {
  const corredores = criarSegmentosDeCorredores(salas, [
    { origem: 'main', destino: 'A' }, { origem: 'A', destino: 'main' },
    { origem: 'A', destino: 'B' }, { origem: 'B', destino: 'A' },
    { origem: 'B', destino: 'B' },
  ]);
  const antes = structuredClone(corredores);
  assert.deepEqual(calcularRotaCaminhavel(salas, corredores,
    { x: 100, y: 100 }, 'B'), [
    { x: 100, y: 100 }, { x: 200, y: 100 }, { x: 200, y: 200 },
  ]);
  assert.deepEqual(corredores, antes);
});
