import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarAmbiente } from './ambiente.js';
import { iniciarJogo, pararJogo } from '../js/jogo.js';

const salas = [
  { nome: 'main', complexidade: 0, x: 235, y: 200, largura: 90, altura: 80, ehSalaInicial: true },
  { nome: 'outra', complexidade: 4, x: 250, y: 40, largura: 60, altura: 60 },
];
const arestas = [{ origem: 'main', destino: 'outra' }];
const masmorra = { salas, larguraMundo: 560, alturaMundo: 480 };

test('só captura movimento depois de clicar no mapa e libera ao clicar fora', () => {
  const ambiente = criarAmbiente();
  const notificacoes = [];

  iniciarJogo(masmorra, arestas, sala => notificacoes.push(sala?.nome ?? null));
  ambiente.avancar();

  assert.deepEqual(notificacoes, ['main']);

  // Sem clicar no mapa, o teclado deve continuar livre para a página.
  const antesDoFoco = ambiente.janela.emitir('keydown', { key: 'W' });
  assert.equal(antesDoFoco.prevenido, undefined);

  ambiente.avancar(10);
  assert.deepEqual(notificacoes, ['main']);

  const canvas = ambiente.elementos.get('canvas-jogo');

  // Clica no mapa: agora o jogo assume os controles.
  ambiente.documento.emitir('pointerdown', {
    target: canvas,
    composedPath() {
      return [canvas];
    }
  });

  const comFoco = ambiente.janela.emitir('keydown', { key: 'W' });
  assert.equal(comFoco.prevenido, true);

  ambiente.avancar(65);

  assert.deepEqual(notificacoes, ['main', null, 'outra']);

  ambiente.janela.emitir('keyup', { key: 'W' });

  // Clica fora do mapa: devolve as setas para a página.
  ambiente.documento.emitir('pointerdown', {
    target: {},
    composedPath() {
      return [];
    }
  });

  const foraDoMapa = ambiente.janela.emitir('keydown', { key: 'ArrowDown' });
  assert.equal(foraDoMapa.prevenido, undefined);

  pararJogo();
  assert.equal(ambiente.pendentes.size, 0);
});

test('Esc libera os controles e o mapa pode ser ativado novamente', () => {
  const ambiente = criarAmbiente();
  const estados = [];
  iniciarJogo(masmorra, arestas, () => {}, estado => estados.push(estado));
  const canvas = ambiente.elementos.get('canvas-jogo');

  assert.deepEqual(estados, [false]);

  ambiente.documento.emitir('pointerdown', {
    target: canvas,
    composedPath() {
      return [canvas];
    }
  });

  assert.deepEqual(estados, [false, true]);
  const duranteExploracao = ambiente.janela.emitir('keydown', { key: 'ArrowRight' });
  assert.equal(duranteExploracao.prevenido, true);

  ambiente.janela.emitir('keydown', { key: 'Escape' });

  assert.deepEqual(estados, [false, true, false]);
  const depoisDoEscape = ambiente.janela.emitir('keydown', { key: 'ArrowRight' });
  assert.equal(depoisDoEscape.prevenido, undefined);

  ambiente.documento.emitir('pointerdown', {
    target: canvas,
    composedPath() {
      return [canvas];
    }
  });

  assert.deepEqual(estados, [false, true, false, true]);
  const depoisDaReativacao = ambiente.janela.emitir('keydown', { key: 'ArrowRight' });
  assert.equal(depoisDaReativacao.prevenido, true);

  pararJogo();
});

test('reiniciar mantém apenas um ciclo e parar remove todos os eventos', () => {
  const ambiente = criarAmbiente();
  for (let indice = 0; indice < 5; indice++) iniciarJogo(masmorra, arestas, () => {});
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
  iniciarJogo(masmorra, arestas, sala => notificacoes.push(sala?.nome ?? null));
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

test('usa os limites do mundo para alcançar salas além do viewport', () => {
  const ambiente = criarAmbiente();
  const notificacoes = [];
  const masmorraGrande = {
    salas: [
      { nome: 'main', complexidade: 0, x: 700, y: 200, largura: 90, altura: 80, ehSalaInicial: true },
      { nome: 'longe', complexidade: 0, x: 900, y: 200, largura: 60, altura: 60 },
    ],
    larguraMundo: 1200,
    alturaMundo: 480,
  };

  iniciarJogo(
    masmorraGrande,
    [{ origem: 'main', destino: 'longe' }],
    sala => notificacoes.push(sala?.nome ?? null)
  );
  ambiente.avancar();

  const canvas = ambiente.elementos.get('canvas-jogo');
  ambiente.documento.emitir('pointerdown', {
    target: canvas,
    composedPath() {
      return [canvas];
    }
  });
  ambiente.janela.emitir('keydown', { key: 'ArrowRight' });
  ambiente.avancar(80);
  ambiente.janela.emitir('keyup', { key: 'ArrowRight' });

  assert.deepEqual(notificacoes, ['main', null, 'longe']);
  pararJogo();
});

test('reiniciar com mundo pequeno redefine a transformação da câmera', () => {
  const ambiente = criarAmbiente();
  const mundoGrande = {
    salas: [
      { nome: 'main', complexidade: 0, x: 700, y: 200, largura: 90, altura: 80, ehSalaInicial: true },
    ],
    larguraMundo: 1200,
    alturaMundo: 480,
  };
  const mundoPequeno = {
    salas: [
      { nome: 'main', complexidade: 0, x: 235, y: 200, largura: 90, altura: 80, ehSalaInicial: true },
    ],
    larguraMundo: 560,
    alturaMundo: 480,
  };

  iniciarJogo(mundoGrande, [], () => {});
  ambiente.avancar();
  assert.notEqual(ambiente.elementos.get('canvas-jogo').translacoes.at(-1).x, 0);

  iniciarJogo(mundoPequeno, [], () => {});
  ambiente.avancar();
  assert.deepEqual(ambiente.elementos.get('canvas-jogo').translacoes.at(-1), { x: 0, y: 0 });
  pararJogo();
});
