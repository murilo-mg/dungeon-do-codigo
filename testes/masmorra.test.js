import { test } from 'node:test';
import assert from 'node:assert/strict';
import { construirMasmorra } from '../js/masmorra.js';

test('lista vazia produz uma masmorra vazia, sem sala fictícia', () => {
  assert.deepEqual(construirMasmorra([]), []);
});

test('preserva os dados da sala inicial com main ou com a primeira função disponível', () => {
  const auxiliar = { nome: 'auxiliar', corpo: '', textoCompleto: 'void auxiliar() {}',
    linhas: 0, estruturasControle: 0, complexidade: 0 };
  const principal = { ...auxiliar, nome: 'main', corpo: 'auxiliar();' };
  assert.equal(construirMasmorra([auxiliar])[0].nome, 'auxiliar');
  const salas = construirMasmorra([auxiliar, principal]);
  assert.equal(salas.length, 2);
  assert.equal(salas[0].nome, 'main');
  assert.equal(salas[0].ehSalaInicial, true);
  assert.equal(salas[1].ehChamadaPelaPrincipal, true);
  assert.deepEqual([auxiliar, principal].map(funcao => funcao.nome), ['auxiliar', 'main']);
});
