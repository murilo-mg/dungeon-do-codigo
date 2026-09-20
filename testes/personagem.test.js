import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarPersonagem, atualizarPersonagem } from '../js/personagem.js';

const limites = { largura: 560, altura: 480 };
function caminhar(quadros, direcao) {
  const jogador = criarPersonagem(100, 100);
  for (let indice = 0; indice < quadros; indice++) {
    atualizarPersonagem(jogador, direcao, 1 / quadros, limites);
  }
  return jogador;
}

test('percorre a mesma distância em 30, 60 e 144 Hz, inclusive na diagonal', () => {
  for (const quadros of [30, 60, 144]) {
    for (const direcao of [{ x: 1, y: 0 }, { x: 1, y: 1 }]) {
      const jogador = caminhar(quadros, direcao);
      assert.ok(Math.abs(Math.hypot(jogador.x - 100, jogador.y - 100) - 156) < 0.001);
    }
  }
});

test('para, mantém a direção e remove as pegadas depois de soltar a tecla', () => {
  const jogador = caminhar(60, { x: 1, y: 0 });
  assert.ok(jogador.passos.length > 0);
  const x = jogador.x;
  for (let indice = 0; indice < 240; indice++) {
    atualizarPersonagem(jogador, { x: 0, y: 0 }, 1 / 60, limites);
  }
  assert.equal(jogador.x, x);
  assert.equal(jogador.direcao, 'direita');
  assert.equal(jogador.andando, false);
  assert.equal(jogador.tempoAndando, 0);
  assert.ok(jogador.tempoParado > 3);
  assert.equal(jogador.passos.length, 0);
});

test('mantém o sprite dentro do canvas e não anda contra o limite', () => {
  const jogador = criarPersonagem(548, 466);
  atualizarPersonagem(jogador, { x: 1, y: 1 }, 1 / 30, limites);
  assert.equal(jogador.x, 548);
  assert.equal(jogador.y, 466);
  assert.equal(jogador.andando, false);
});

test('redução de movimento conserva a navegação e elimina rastros', () => {
  const jogador = caminhar(60, { x: 0, y: 1 });
  const y = jogador.y;
  atualizarPersonagem(jogador, { x: 0, y: 1 }, 1 / 60, limites, true);
  assert.ok(jogador.y > y);
  assert.equal(jogador.passos.length, 0);
});
