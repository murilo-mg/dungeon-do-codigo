import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarCenario, posicaoLivreParaDecoracao } from '../js/cenario.js';

const salas = [
  { x: 235, y: 200, largura: 90, altura: 80, ehSalaInicial: true },
  { x: 250, y: 40, largura: 60, altura: 60 },
];

test('exclui salas, suas bordas e corredores da decoração', () => {
  assert.equal(posicaoLivreParaDecoracao({ x: 250, y: 220 }, salas), false);
  assert.equal(posicaoLivreParaDecoracao({ x: 230, y: 220 }, salas), false);
  assert.equal(posicaoLivreParaDecoracao({ x: 280, y: 150 }, salas), false);
  assert.equal(posicaoLivreParaDecoracao({ x: 80, y: 150 }, salas), true);
});

test('gera cenário estável e limitado dentro do canvas', () => {
  const cenario = criarCenario(salas, 560, 480);
  assert.deepEqual(cenario, criarCenario(salas, 560, 480));
  assert.equal(cenario.nuvens.length, 6);
  assert.ok(cenario.decoracoes.length > 0 && cenario.decoracoes.length < 40);
  assert.ok(cenario.decoracoes.some(decoracao => decoracao.tipo === 'tocha'));
  for (const decoracao of cenario.decoracoes) {
    assert.ok(posicaoLivreParaDecoracao(decoracao, salas));
    assert.ok(decoracao.x >= 12 && decoracao.x < 548);
    assert.ok(decoracao.y >= 16 && decoracao.y < 471);
  }
});
