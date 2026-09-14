import { test } from 'node:test';
import assert from 'node:assert/strict';
import { obterCriatura, desenharCriatura } from '../js/criaturas.js';
import { criarParticulasDeEntrada, atualizarParticulas } from '../js/efeitos.js';

test('criatura respeita os limites de perigo usados pelas salas', () => {
  assert.equal(obterCriatura(0).nivel, 'baixo');
  assert.equal(obterCriatura(2).nivel, 'baixo');
  assert.equal(obterCriatura(3).nivel, 'médio');
  assert.equal(obterCriatura(6).nivel, 'médio');
  assert.equal(obterCriatura(7).nivel, 'alto');
  assert.equal(obterCriatura(100).nivel, 'alto');
});

test('desenhos cabem no retrato e a mesma criatura escala sem trocar os pixels', () => {
  function renderizar(complexidade, escala) {
    const pixels = [];
    const contexto = { save() {}, restore() {}, fillRect(...coordenadas) { pixels.push(coordenadas); } };
    desenharCriatura(contexto, complexidade, 0, 0, escala);
    return pixels;
  }
  for (const complexidade of [0, 4, 10]) {
    const criatura = obterCriatura(complexidade);
    assert.equal(criatura.desenho.length, 14);
    assert.ok(criatura.desenho.every(linha => linha.length === 12));
    const pequeno = renderizar(complexidade, 2);
    const grande = renderizar(complexidade, 4);
    assert.deepEqual(grande, pequeno.map(pixel => pixel.map(valor => valor * 2)));
  }
});

test('partículas são limitadas e desaparecem por completo', () => {
  let particulas = [];
  for (let indice = 0; indice < 100; indice++) particulas = criarParticulasDeEntrada(particulas, 10, 20);
  assert.equal(particulas.length, 60);
  particulas = atualizarParticulas(particulas, 0.3);
  assert.notEqual(particulas[0].x, 10);
  assert.equal(atualizarParticulas(particulas, 0.3).length, 0);
});
