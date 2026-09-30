import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarAmbiente } from './ambiente.js';
import { LARGURA_CORREDOR } from '../js/corredores.js';
import { RAIO_BASE_PERSONAGEM } from '../js/personagem.js';
import { encaixarMasmorra, focarSala, iniciarJogo, pararJogo,
  restaurarZoomCamera, selecionarModoVisual } from '../js/jogo.js';

function ativar(ambiente) {
  const canvas = ambiente.elementos.get('canvas-jogo');
  ambiente.documento.emitir('pointerdown', { composedPath: () => [canvas] });
  return canvas;
}

test('foco por teclado permite explorar e sair com Esc sem exigir clique prévio', () => {
  const ambiente = criarAmbiente();
  const canvas = ambiente.elementos.get('canvas-jogo');
  iniciarJogo({ salas: [{ nome: 'main', x: 60, y: 60, largura: 80, altura: 80,
    complexidade: 0, ehSalaInicial: true }], larguraMundo: 560, alturaMundo: 480 }, [], () => {});
  ambiente.avancar();
  const inicio = canvas.posicoesPersonagem.at(-1);
  canvas.emitir('focus');
  andar(ambiente, 'd', 5);
  assert.ok(canvas.posicoesPersonagem.at(-1).x > inicio.x);
  ambiente.janela.emitir('keydown', { key: 'Escape' });
  const final = canvas.posicoesPersonagem.at(-1);
  andar(ambiente, 'd', 5);
  assert.deepEqual(canvas.posicoesPersonagem.at(-1), final);
  pararJogo();
  assert.equal(canvas.ouvintes.get('focus').size, 0);
  assert.equal(canvas.ouvintes.get('blur').size, 0);
});

function andar(ambiente, tecla, quadros) {
  ambiente.janela.emitir('keydown', { key: tecla });
  ambiente.avancar(quadros);
  ambiente.janela.emitir('keyup', { key: tecla });
}

function navegar(ambiente, sala) {
  const canvas = ambiente.elementos.get('canvas-jogo');
  const translacao = canvas.translacoes.at(-1);
  const zoom = canvas.escalas.at(-1).x;
  const evento = { clientX: (sala.x + sala.largura / 2 + translacao.x) * zoom,
    clientY: (sala.y + sala.altura / 2 + translacao.y) * zoom, button: 0 };
  for (const detail of [1, 2]) {
    ambiente.documento.emitir('pointerdown', { ...evento, detail, composedPath: () => [canvas] });
    canvas.emitir('click', { ...evento, detail });
  }
  canvas.emitir('dblclick', { ...evento, detail: 2 });
}

test('WASD bloqueia paredes enquanto roda e Shift+roda olham o mundo sem mover o personagem', () => {
  const ambiente = criarAmbiente();
  const sala = { nome: 'main', x: 60, y: 60, largura: 80, altura: 80,
    complexidade: 0, ehSalaInicial: true };
  iniciarJogo({ salas: [sala], larguraMundo: 2000, alturaMundo: 1400 }, [], () => {});
  ambiente.avancar();
  const canvas = ativar(ambiente);
  const inicial = canvas.posicoesPersonagem.at(-1);
  const roda = (deltaY, shiftKey = false) => canvas.emitir('wheel', {
    clientX: 250, clientY: 200, deltaX: 0, deltaY, shiftKey,
  });
  assert.equal(roda(250).prevenido, true);
  roda(150, true);
  ambiente.avancar(3);
  assert.deepEqual(canvas.posicoesPersonagem.at(-1), inicial);
  assert.deepEqual(canvas.translacoes.at(-1), { x: -150, y: -250 });

  andar(ambiente, 'd', 80);
  const parede = canvas.posicoesPersonagem.at(-1);
  assert.equal(parede.x, 140 - RAIO_BASE_PERSONAGEM);
  assert.equal(parede.y, inicial.y);
  assert.deepEqual(canvas.translacoes.at(-1), { x: -150, y: -250 });
  selecionarModoVisual('estrutura');
  ambiente.avancar();
  assert.deepEqual(canvas.posicoesPersonagem.at(-1), parede);
  encaixarMasmorra();
  ambiente.avancar();
  restaurarZoomCamera();
  ambiente.avancar();
  assert.deepEqual(canvas.posicoesPersonagem.at(-1), parede);
  ambiente.janela.emitir('keydown', { key: 'Escape' });
  andar(ambiente, 'a', 20);
  assert.deepEqual(canvas.posicoesPersonagem.at(-1), parede);
  pararJogo();
  assert.equal(canvas.ouvintes.get('wheel').size, 0);
});

test('cruzamento bloqueia atalho manual e automático; sala conectada continua acessível', () => {
  const ambiente = criarAmbiente();
  const salas = [
    { nome: 'a', x: 60, y: 200, largura: 80, altura: 80, ehSalaInicial: true },
    { nome: 'b', x: 400, y: 210, largura: 60, altura: 60 },
    { nome: 'c', x: 230, y: 80, largura: 60, altura: 60 },
    { nome: 'd', x: 230, y: 350, largura: 60, altura: 60 },
  ].map(sala => ({ complexidade: 0, ...sala }));
  const selecoes = [];
  const fisicas = [];
  iniciarJogo({ salas, larguraMundo: 560, alturaMundo: 480 },
    [{ origem: 'a', destino: 'b' }, { origem: 'c', destino: 'd' }],
    sala => fisicas.push(sala?.nome ?? null), undefined, undefined, nome => {
      selecoes.push(nome);
      return focarSala(nome);
    });
  ambiente.avancar();
  const canvas = ativar(ambiente);
  andar(ambiente, 'd', 63);
  assert.ok(Math.abs(canvas.posicoesPersonagem.at(-1).x - 260) <= 2);
  andar(ambiente, 's', 50);
  const cruzamento = canvas.posicoesPersonagem.at(-1);
  assert.equal(cruzamento.y, 240 + LARGURA_CORREDOR / 2 - RAIO_BASE_PERSONAGEM);
  assert.deepEqual(fisicas, ['a', null]);

  navegar(ambiente, salas[3]);
  ambiente.avancar(50);
  assert.equal(selecoes.at(-1), 'd');
  assert.deepEqual(canvas.posicoesPersonagem.at(-1), cruzamento);
  assert.deepEqual(fisicas, ['a', null]);

  navegar(ambiente, salas[1]);
  ambiente.avancar(120);
  assert.deepEqual(canvas.posicoesPersonagem.at(-1), { x: 430, y: 240 });
  pararJogo();

  // Um mundo novo começa na própria entrada, sem herdar a identidade do corredor.
  iniciarJogo({ salas: [{ ...salas[2], ehSalaInicial: true }],
    larguraMundo: 560, alturaMundo: 480 }, [], () => {});
  ambiente.avancar();
  ativar(ambiente);
  andar(ambiente, 's', 80);
  assert.equal(canvas.posicoesPersonagem.at(-1).y, 140 - RAIO_BASE_PERSONAGEM);
  pararJogo();
});
