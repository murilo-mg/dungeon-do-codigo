import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarCenario, posicaoLivreParaDecoracao } from '../js/cenario.js';

const salas = [
  { nome: 'main', x: 235, y: 200, largura: 90, altura: 80, ehSalaInicial: true },
  { nome: 'outra', x: 250, y: 40, largura: 60, altura: 60 },
  { nome: 'semChamada', x: 80, y: 80, largura: 60, altura: 60 },
];
const segmentos = [{
  origem: 'main',
  destino: 'outra',
  inicio: { x: 280, y: 240 },
  fim: { x: 280, y: 70 },
}];

test('exclui salas, suas bordas e corredores reais da decoração', () => {
  assert.equal(posicaoLivreParaDecoracao({ x: 250, y: 220 }, salas, segmentos), false);
  assert.equal(posicaoLivreParaDecoracao({ x: 230, y: 220 }, salas, segmentos), false);
  assert.equal(posicaoLivreParaDecoracao({ x: 280, y: 150 }, salas, segmentos), false);
  assert.equal(posicaoLivreParaDecoracao({ x: 160, y: 150 }, salas, segmentos), true);
});

test('não reserva espaço para corredor fictício sem segmento real', () => {
  assert.equal(posicaoLivreParaDecoracao({ x: 195, y: 175 }, salas, segmentos), true);
});

const salasParaCenario = [
  { x: 235, y: 200, largura: 90, altura: 80, ehSalaInicial: true },
  { x: 250, y: 40, largura: 60, altura: 60 },
];

test('gera cenário estável e limitado dentro do canvas', () => {
  const cenario = criarCenario(salasParaCenario, 560, 480);
  assert.deepEqual(cenario, criarCenario(salasParaCenario, 560, 480));
  assert.equal(cenario.nuvens.length, 6);
  assert.ok(cenario.decoracoes.length > 0 && cenario.decoracoes.length < 40);
  assert.ok(cenario.decoracoes.some(decoracao => decoracao.tipo === 'tocha'));
  for (const decoracao of cenario.decoracoes) {
    assert.ok(posicaoLivreParaDecoracao(decoracao, salasParaCenario));
    assert.ok(decoracao.x >= 12 && decoracao.x < 548);
    assert.ok(decoracao.y >= 16 && decoracao.y < 471);
  }
});
