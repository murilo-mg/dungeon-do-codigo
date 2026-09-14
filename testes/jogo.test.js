import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarAmbiente } from './ambiente.js';
import { iniciarJogo, pararJogo } from '../js/jogo.js';

const salas = [
  { nome: 'main', complexidade: 0, x: 235, y: 200, largura: 90, altura: 80, ehSalaInicial: true },
  { nome: 'outra', complexidade: 4, x: 250, y: 40, largura: 60, altura: 60 },
];

test('navega, notifica só transições e libera as teclas ao perder o foco', () => {
  const ambiente = criarAmbiente();
  const notificacoes = [];
  iniciarJogo(salas, sala => notificacoes.push(sala?.nome ?? null));
  ambiente.avancar();
  assert.deepEqual(notificacoes, ['main']);
  const evento = ambiente.janela.emitir('keydown', { key: 'W' });
  assert.equal(evento.prevenido, true);
  ambiente.avancar(65);
  assert.deepEqual(notificacoes, ['main', null, 'outra']);
  ambiente.janela.emitir('blur');
  ambiente.avancar(65);
  assert.deepEqual(notificacoes, ['main', null, 'outra']);
  pararJogo();
  assert.equal(ambiente.pendentes.size, 0);
});

test('reiniciar mantém apenas um ciclo e parar remove todos os eventos', () => {
  const ambiente = criarAmbiente();
  for (let indice = 0; indice < 5; indice++) iniciarJogo(salas, () => {});
  assert.equal(ambiente.pendentes.size, 1);
  assert.equal(ambiente.janela.ouvintes.get('keydown').size, 1);
  const atalho = ambiente.janela.emitir('keydown', { key: 'd', ctrlKey: true });
  assert.equal(atalho.prevenido, undefined);
  pararJogo();
  assert.equal(ambiente.pendentes.size, 0);
  for (const ouvintes of ambiente.janela.ouvintes.values()) assert.equal(ouvintes.size, 0);
  for (const ouvintes of ambiente.documento.ouvintes.values()) assert.equal(ouvintes.size, 0);
});

test('ignora digitação em campos e libera movimento quando a aba fica oculta', () => {
  const ambiente = criarAmbiente();
  const notificacoes = [];
  iniciarJogo(salas, sala => notificacoes.push(sala?.nome ?? null));
  ambiente.avancar();
  const evento = ambiente.janela.emitir('keydown', { key: 'w', target: { closest() { return true; } } });
  assert.equal(evento.prevenido, undefined);
  ambiente.avancar(65);
  assert.deepEqual(notificacoes, ['main']);
  ambiente.janela.emitir('keydown', { key: 'ArrowUp' });
  ambiente.avancar(10);
  ambiente.documento.emitir('visibilitychange');
  ambiente.avancar(65);
  assert.deepEqual(notificacoes, ['main']);
  pararJogo();
});
