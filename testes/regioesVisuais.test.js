import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularLimitesVisuaisRegioes } from '../js/semanticaVisual.js';

const regiao = (funcoes, titulo = 'Ala 1') => ({
  id: 'ala:1', tipo: 'ala', titulo, funcoes,
});

test('região de uma sala envolve somente sua área com margem constante', () => {
  const sala = { nome: 'A', x: 100, y: 80, largura: 60, altura: 70 };
  assert.deepEqual(calcularLimitesVisuaisRegioes([regiao(['A'])], [sala], 16), [{
    id: 'ala:1', tipo: 'ala', titulo: 'Ala 1',
    x: sala.x - 16, y: sala.y - 16,
    largura: sala.largura + 32, altura: sala.altura + 32,
  }]);
});

test('limites de várias salas consideram extremos e dimensões diferentes', () => {
  const salas = [
    { nome: 'A', x: 120, y: 90, largura: 50, altura: 45 },
    { nome: 'B', x: 220, y: 130, largura: 110, altura: 85 },
    { nome: 'C', x: 90, y: 190, largura: 65, altura: 30 },
    { nome: 'fora', x: 500, y: 500, largura: 200, altura: 200 },
  ];
  const [limites] = calcularLimitesVisuaisRegioes([regiao(['A', 'B', 'C'])], salas, 20);
  assert.deepEqual({ x: limites.x, y: limites.y,
    direita: limites.x + limites.largura, base: limites.y + limites.altura },
  { x: 70, y: 70, direita: 350, base: 240 });
});

test('regiões ausentes ou sem sala válida não produzem contorno artificial', () => {
  const salas = [{ nome: 'A', x: 10, y: 20, largura: 60, altura: 60 }];
  assert.deepEqual(calcularLimitesVisuaisRegioes([], salas), []);
  assert.deepEqual(calcularLimitesVisuaisRegioes([regiao(['inexistente'])], salas), []);
  assert.equal(calcularLimitesVisuaisRegioes([regiao(['A', 'inexistente'])], salas).length, 1);
});

test('cálculo é determinístico e não modifica salas nem regiões', () => {
  const salas = [{ nome: 'A', x: 10, y: 20, largura: 60, altura: 60 },
    { nome: 'B', x: 100, y: 30, largura: 90, altura: 70 }];
  const regioes = [regiao(['A'], 'Ala 1'), regiao(['B'], 'Ala 2')];
  const antes = structuredClone({ salas, regioes });
  const primeiro = calcularLimitesVisuaisRegioes(regioes, salas);
  assert.deepEqual(calcularLimitesVisuaisRegioes(regioes, salas), primeiro);
  assert.deepEqual({ salas, regioes }, antes);
  assert.deepEqual(primeiro.map(item => item.titulo), ['Ala 1', 'Ala 2']);
});
