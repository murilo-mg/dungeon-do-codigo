import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarSegmentosDeCorredores } from '../js/corredores.js';

const salas = [
  { nome: 'main', x: 0, y: 0, largura: 20, altura: 20 },
  { nome: 'a', x: 100, y: 0, largura: 20, altura: 20 },
  { nome: 'b', x: 200, y: 0, largura: 20, altura: 20 },
  { nome: 'c', x: 100, y: 100, largura: 20, altura: 20 },
  { nome: 'isolada', x: 300, y: 100, largura: 20, altura: 20 },
];

function nomesDosSegmentos(segmentos) {
  return segmentos.map(segmento => `${segmento.origem}->${segmento.destino}`);
}

test('cria apenas o corredor main -> a', () => {
  assert.deepEqual(
    nomesDosSegmentos(criarSegmentosDeCorredores(salas, [
      { origem: 'main', destino: 'a' },
    ])),
    ['main->a']
  );
});

test('não cria main -> b quando a chamada é main -> a -> b', () => {
  const segmentos = criarSegmentosDeCorredores(salas, [
    { origem: 'main', destino: 'a' },
    { origem: 'a', destino: 'b' },
  ]);

  assert.deepEqual(nomesDosSegmentos(segmentos), ['main->a', 'a->b']);
});

test('preserva ramificação e múltiplos callers', () => {
  const segmentos = criarSegmentosDeCorredores(salas, [
    { origem: 'main', destino: 'a' },
    { origem: 'main', destino: 'b' },
    { origem: 'a', destino: 'c' },
    { origem: 'b', destino: 'c' },
  ]);

  assert.deepEqual(nomesDosSegmentos(segmentos), [
    'main->a', 'main->b', 'a->c', 'b->c',
  ]);
});

test('ignora função isolada, sala ausente e aresta duplicada', () => {
  const segmentos = criarSegmentosDeCorredores(salas, [
    { origem: 'main', destino: 'ausente' },
    { origem: 'main', destino: 'a' },
    { origem: 'main', destino: 'a' },
  ]);

  assert.deepEqual(nomesDosSegmentos(segmentos), ['main->a']);
});

test('ignora autoaresta sem criar segmento degenerado', () => {
  assert.deepEqual(
    criarSegmentosDeCorredores(salas, [{ origem: 'a', destino: 'a' }]),
    []
  );
});

test('preserva os dois segmentos de um ciclo sem recursão de renderização', () => {
  const segmentos = criarSegmentosDeCorredores(salas, [
    { origem: 'a', destino: 'b' },
    { origem: 'b', destino: 'a' },
  ]);

  assert.deepEqual(nomesDosSegmentos(segmentos), ['a->b', 'b->a']);
});